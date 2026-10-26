import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service'; // Sửa theo đúng thư mục của bạn
import { OrderStatus } from '../generated/prisma/client'; // Đúng đường dẫn Prisma 7
import { OrderStateMachine } from './order-state-machine.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderStateMachine: OrderStateMachine,
  ) {}

  // Lấy danh sách đơn hàng
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

  // Lấy chi tiết đơn hàng
  async getOrderDetail(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { include: { product: true } },
        statusHistory: true // Bỏ orderBy để tránh lỗi type
      }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new BadRequestException('Không có quyền xem đơn này');

    return order;
  }

  // Hủy đơn hàng
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new BadRequestException('Không có quyền hủy đơn này');

    this.orderStateMachine.assertTransition(order.status, OrderStatus.CANCELLED);

    return this.prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái (Optimistic Locking)
      const updated = await tx.order.updateMany({
        where: { id: orderId, version: order.version },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason || 'Khách hàng tự hủy',
          version: { increment: 1 }
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Đơn hàng vừa được cập nhật, vui lòng thử lại!');
      }

      // Ghi log lịch sử (Dùng toStatus)
      await tx.orderStatusHistory.create({
        data: { 
          orderId: orderId, 
          toStatus: OrderStatus.CANCELLED, 
          note: reason || 'Khách hàng tự hủy' 
        }
      });

      // Hoàn kho
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      return { message: 'Hủy đơn thành công', orderId };
    });
  }
}