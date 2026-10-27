import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  OrderStatus,
  PaymentStatus,
  type Payment,
} from '../generated/prisma/client';
import { OrderStateMachine } from '../orders/order-state-machine.service';
import { loyaltyPointsFor } from '../users/loyalty-points';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VnpayService } from './vnpay/vnpay.service';

const PAYABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAYMENT_FAILED,
];

export const QR_VALIDITY_MS = 15 * 60 * 1000;

// Thẻ thử nghiệm luôn bị từ chối, dùng để demo màn thanh toán thất bại.
export const DECLINED_TEST_CARD = '4000000000000002';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PaymentResult = Payment & {
  rewardPoints: number;
  qrExpiresAt: Date | null;
  paymentUrl: string | null;
};

// Mã phản hồi theo đặc tả IPN của VNPay.
export interface VnpayCallbackOutcome {
  code: '00' | '01' | '02' | '04' | '97';
  message: string;
  paymentId?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderStateMachine: OrderStateMachine,
    private readonly vnpay: VnpayService,
  ) {}

  async create(
    userId: string,
    dto: CreatePaymentDto,
    ipAddress = '127.0.0.1',
  ): Promise<PaymentResult> {
    // 1. Kiểm tra đơn hàng tồn tại và thuộc về người dùng hiện tại.
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found.');
    }

    // 2. Kiểm tra khóa Idempotency đã được sử dụng chưa.
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existing) {
      // Cùng khóa nhưng khác yêu cầu: không cho tái sử dụng khóa.
      if (existing.orderId !== dto.orderId || existing.method !== dto.method) {
        throw new ConflictException(
          'Idempotency key has already been used for another request.',
        );
      }

      // Cùng yêu cầu: trả lại bản ghi cũ, không tạo thanh toán mới.
      return this.withPaymentUrl(this.toResult(existing), order.code, ipAddress);
    }

    // 3. Chỉ nhận thanh toán cho đơn đang chờ thanh toán.
    if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
      throw new ConflictException('Order is not awaiting payment.');
    }

    // 4. Tạo bản ghi thanh toán ở trạng thái PENDING.
    let payment: Payment;
    try {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: dto.idempotencyKey,
          method: dto.method,
          amount: order.total,
          status: PaymentStatus.PENDING,
        },
      });
    } catch (error: unknown) {
      // Hai request đồng thời có thể cùng kiểm tra khóa trước khi
      // một request kịp tạo bản ghi. Ràng buộc UNIQUE xử lý trường hợp này.
      const isUniqueError =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002';

      if (isUniqueError) {
        const concurrent = await this.prisma.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });

        if (concurrent) {
          if (
            concurrent.orderId !== dto.orderId ||
            concurrent.method !== dto.method
          ) {
            throw new ConflictException(
              'Idempotency key has already been used for another request.',
            );
          }

          return this.withPaymentUrl(this.toResult(concurrent), order.code, ipAddress);
        }
      }

      throw error;
    }

    // 5a. VNPay: chuyển khách sang cổng VNPay, kết quả do VNPay xác nhận.
    if (dto.method === 'VNPAY') {
      return this.withPaymentUrl(this.toResult(payment), order.code, ipAddress);
    }

    // 5b. Giả lập cổng thanh toán: Ví và Thẻ có kết quả ngay, QR chờ xác nhận.
    if (dto.method === 'QR') {
      return this.toResult(payment);
    }

    if (dto.method === 'CARD' && dto.cardNumber === DECLINED_TEST_CARD) {
      return this.settleFailure(payment.id, 'Thẻ bị ngân hàng từ chối.');
    }

    return this.settleSuccess(payment.id);
  }

  async findOne(userId: string, paymentId: string) {
    if (!UUID_PATTERN.test(paymentId)) {
      throw new NotFoundException('Payment not found.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { code: true, userId: true } } },
    });

    if (!payment || payment.order.userId !== userId) {
      throw new NotFoundException('Payment not found.');
    }

    const { order, ...rest } = payment;
    return { ...this.toResult(rest), orderCode: order.code };
  }

  // Xử lý kết quả VNPay gửi về (Return URL của trình duyệt hoặc IPN của máy chủ).
  // Hai đường có thể đến cùng lúc nên thao tác phải idempotent.
  async handleVnpayCallback(query: Record<string, unknown>): Promise<VnpayCallbackOutcome> {
    const result = this.vnpay.verify(query);

    if (!result.isValidSignature) {
      return { code: '97', message: 'Invalid signature' };
    }

    const payment = UUID_PATTERN.test(result.txnRef)
      ? await this.prisma.payment.findUnique({ where: { id: result.txnRef } })
      : null;

    if (!payment || payment.method !== 'VNPAY') {
      return { code: '01', message: 'Order not found' };
    }

    // Luôn đối chiếu số tiền với database, không tin số tiền trong URL.
    if (payment.amount !== result.amount) {
      return { code: '04', message: 'Invalid amount', paymentId: payment.id };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return { code: '02', message: 'Order already confirmed', paymentId: payment.id };
    }

    if (result.isSuccess) {
      await this.settleSuccess(payment.id);
    } else {
      await this.settleFailure(
        payment.id,
        result.responseCode === '24'
          ? 'Khách đã hủy giao dịch trên VNPay.'
          : `VNPay từ chối giao dịch (mã ${result.responseCode}).`,
      );
    }

    return { code: '00', message: 'Confirm Success', paymentId: payment.id };
  }

  // Giả lập ngân hàng báo đã nhận chuyển khoản cho mã QR.
  async confirmQr(userId: string, paymentId: string): Promise<PaymentResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment || payment.order.userId !== userId || payment.method !== 'QR') {
      throw new NotFoundException('Payment not found.');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      const { order: _order, ...rest } = payment;
      return this.toResult(rest);
    }

    if (Date.now() > payment.createdAt.getTime() + QR_VALIDITY_MS) {
      await this.prisma.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.FAILED, failureReason: 'Mã QR đã hết hạn.' },
      });
      throw new ConflictException('Mã QR đã hết hạn, vui lòng tạo mã mới.');
    }

    return this.settleSuccess(payment.id);
  }

  private async settleSuccess(paymentId: string): Promise<PaymentResult> {
    return this.prisma.$transaction(async (tx) => {
      const { order } = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { order: true },
      });

      // Đơn có thể đã bị hủy (quá hạn) trong lúc chờ thanh toán.
      if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
        const failed = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: 'Đơn hàng không còn chờ thanh toán.',
          },
        });
        return this.toResult(failed);
      }

      const claimed = await tx.payment.updateMany({
        where: { id: paymentId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.SUCCEEDED },
      });
      if (claimed.count === 0) {
        return this.toResult(await tx.payment.findUniqueOrThrow({ where: { id: paymentId } }));
      }

      // Đơn thanh toán lỗi trước đó phải quay lại PENDING rồi mới sang PAID.
      const path: OrderStatus[] =
        order.status === OrderStatus.PAYMENT_FAILED
          ? [OrderStatus.PENDING, OrderStatus.PAID]
          : [OrderStatus.PAID];
      let current = order.status;
      for (const next of path) {
        this.orderStateMachine.assertTransition(current, next);
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, fromStatus: current, toStatus: next, note: 'Thanh toán thành công.' },
        });
        current = next;
      }

      const updated = await tx.order.updateMany({
        where: { id: order.id, version: order.version },
        data: { status: OrderStatus.PAID, version: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new ConflictException('Đơn hàng vừa được cập nhật, vui lòng thử lại.');
      }

      const rewardPoints = loyaltyPointsFor(order.total);
      await tx.user.update({
        where: { id: order.userId },
        data: { loyaltyPoints: { increment: rewardPoints } },
      });

      const succeeded = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      return { ...succeeded, rewardPoints, qrExpiresAt: null, paymentUrl: null };
    });
  }

  private async settleFailure(paymentId: string, reason: string): Promise<PaymentResult> {
    return this.prisma.$transaction(async (tx) => {
      const failed = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED, failureReason: reason },
        include: { order: true },
      });
      const { order, ...payment } = failed;

      if (order.status === OrderStatus.PENDING) {
        const updated = await tx.order.updateMany({
          where: { id: order.id, version: order.version },
          data: { status: OrderStatus.PAYMENT_FAILED, version: { increment: 1 } },
        });
        if (updated.count === 1) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: OrderStatus.PENDING,
              toStatus: OrderStatus.PAYMENT_FAILED,
              note: reason,
            },
          });
        }
      }

      return this.toResult(payment);
    });
  }

  private toResult(payment: Payment): PaymentResult {
    let rewardPoints = 0;
    if (payment.status === PaymentStatus.SUCCEEDED) {
      rewardPoints = loyaltyPointsFor(payment.amount);
    }
    const qrExpiresAt =
      payment.method === 'QR' && payment.status === PaymentStatus.PENDING
        ? new Date(payment.createdAt.getTime() + QR_VALIDITY_MS)
        : null;
    return { ...payment, rewardPoints, qrExpiresAt, paymentUrl: null };
  }

  private withPaymentUrl(
    result: PaymentResult,
    orderCode: string,
    ipAddress: string,
  ): PaymentResult {
    if (result.method !== 'VNPAY' || result.status !== PaymentStatus.PENDING) {
      return result;
    }

    return {
      ...result,
      paymentUrl: this.vnpay.buildPaymentUrl({
        txnRef: result.id,
        amount: result.amount,
        orderInfo: `Thanh toan don hang ${orderCode}`,
        ipAddress,
      }),
    };
  }
}
