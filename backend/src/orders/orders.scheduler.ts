import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '../generated/prisma/enums';

@Injectable()
export class OrdersScheduler {
  private readonly logger = new Logger(OrdersScheduler.name);

  constructor(private prisma: PrismaService) {}

  // Chạy mỗi phút để kiểm tra đơn quá hạn 15 phút
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredOrders() {
    const now = new Date();

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        expiresAt: { lt: now },
      },
      include: { items: true },
    });

    if (expiredOrders.length === 0) return;

    this.logger.log(`Tìm thấy ${expiredOrders.length} đơn hàng quá hạn thanh toán. Đang tiến hành hủy và hoàn kho...`);

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        // 1. Chỉ hủy nếu đơn vẫn đang chờ thanh toán (tránh hủy đơn vừa được thanh toán)
        const cancelled = await tx.order.updateMany({
          where: { id: order.id, status: OrderStatus.PENDING, version: order.version },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: now,
            cancelReason: 'Quá hạn thanh toán',
            version: { increment: 1 },
          },
        });
        if (cancelled.count === 0) return;

        // 2. Ghi lịch sử trạng thái
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: OrderStatus.PENDING,
            toStatus: OrderStatus.CANCELLED,
            note: 'Đơn hàng tự động hủy do quá hạn 15 phút chưa thanh toán.',
          },
        });

        // 3. Hoàn lại số lượng tồn kho sản phẩm
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    }
  }
}