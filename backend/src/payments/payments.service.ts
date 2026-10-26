import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    // 1. Kiểm tra khóa Idempotency đã được sử dụng chưa.
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
      return existing;
    }

    // 2. Kiểm tra đơn hàng tồn tại.
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    // 3. Tạo bản ghi thanh toán ở trạng thái PENDING.
    try {
      return await this.prisma.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: dto.idempotencyKey,
          method: dto.method,
          amount: order.total,
          status: 'PENDING',
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
        const payment = await this.prisma.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });

        if (payment) {
          if (
            payment.orderId !== dto.orderId ||
            payment.method !== dto.method
          ) {
            throw new ConflictException(
              'Idempotency key has already been used for another request.',
            );
          }

          return payment;
        }
      }

      throw error;
    }
  }
}
