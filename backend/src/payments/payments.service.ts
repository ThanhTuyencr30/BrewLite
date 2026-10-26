import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrderStatus, PaymentStatus } from '../generated/prisma/enums';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async processPayment(dto: CreatePaymentDto) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existingPayment) {
      return {
        message: 'Giao dịch đã được xử lý trước đó (Idempotent response).',
        payment: existingPayment,
      };
    }

    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng.');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán.');
      }

      if (order.total !== dto.amount) {
        throw new BadRequestException('Số tiền thanh toán không khớp với tổng giá trị đơn hàng.');
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: dto.idempotencyKey,
          method: dto.method,
          status: PaymentStatus.SUCCEEDED,
          amount: dto.amount,
          providerTransactionId: `TXN-${Date.now()}`,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          note: `Thanh toán thành công qua phương thức ${dto.method}`,
        },
      });

      return {
        message: 'Thanh toán thành công!',
        payment,
      };
    });
  }
}