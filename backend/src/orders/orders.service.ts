import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'; 
import { OrderStatus, PaymentStatus } from '../generated/prisma/client'; 
import { OrderStateMachine } from './order-state-machine.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderStateMachine: OrderStateMachine,
  ) {}

  // 1. Lấy danh sách đơn hàng (Hỗ trợ 4 tab: Tất cả, Đang xử lý, Hoàn thành, Đã hủy)
  async getMyOrders(userId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { 
        userId: userId,
        ...(status && { status: status }) 
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        items: { include: { product: true } } 
      }
    });
  }

  // 2. Lấy chi tiết 1 đơn hàng (Kèm Timeline lịch sử trạng thái)
  async getOrderDetail(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { include: { product: true } },
        statusHistory: true // Lấy lịch sử để vẽ Timeline
      }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new BadRequestException('Không có quyền xem đơn này');

    return order;
  }

  // 3. Hủy đơn hàng (Transaction: Hoàn kho, hoàn tiền, trả mã, lưu log)
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new BadRequestException('Không có quyền hủy đơn này');

    // Kiểm tra State Machine (Chặn không cho hủy nếu đơn đã Hoàn tất)
    this.orderStateMachine.assertTransition(order.status, OrderStatus.CANCELLED);

    return this.prisma.$transaction(async (tx) => {
      // 3.1. Cập nhật trạng thái đơn (Dùng Optimistic Locking với trường version)
      const updated = await tx.order.updateMany({
        where: { id: orderId, version: order.version },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason || 'Khách hàng tự hủy',
          version: { increment: 1 } // Tăng version để chống ghi đè đồng thời
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Đơn hàng vừa được cập nhật, vui lòng thử lại!');
      }

      // 3.2. Ghi log lịch sử trạng thái (Dùng toStatus theo schema của bạn)
      await tx.orderStatusHistory.create({
        data: { 
          orderId: orderId, 
          toStatus: OrderStatus.CANCELLED, 
          note: reason || 'Khách hàng tự hủy' 
        }
      });

      // 3.3. Hoàn kho (Cộng lại số lượng sản phẩm)
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // 3.4. Hoàn tiền (Nếu đơn đã thanh toán)
      const paidPayment = order.payments.find(p => p.status === PaymentStatus.SUCCEEDED);
      if (paidPayment) {
        await tx.payment.update({
          where: { id: paidPayment.id },
          data: { status: PaymentStatus.REFUNDED } // <-- Và sửa ở đây (Nếu Enum của bạn có REFUNDED)
        });
      }

      // 3.5. Trả lại mã giảm giá (Nếu có)
      if (order.promotionId) {
        // Giả sử bảng Promotion có trường usedCount
        // await tx.promotion.update({
        //   where: { id: order.promotionId },
        //   data: { usedCount: { decrement: 1 } }
        // });
      }

      return { message: 'Hủy đơn thành công', orderId };
    });
  }
}