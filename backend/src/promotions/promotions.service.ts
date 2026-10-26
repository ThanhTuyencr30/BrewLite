import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách mã khuyến mãi đang còn hiệu lực
  async getActivePromotions() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Áp dụng khuyến mãi vào đơn hàng
  async applyPromotionToOrder(orderId: string, promotionCode: string) {
    const now = new Date();

    // 1. Kiểm tra đơn hàng
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể áp mã giảm giá cho đơn hàng đang chờ thanh toán.');
    }

    // 2. Tìm mã khuyến mãi
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: promotionCode.toUpperCase() },
    });

    if (!promotion || !promotion.isActive) {
      throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã bị tắt.');
    }

    if (promotion.startsAt > now || promotion.endsAt < now) {
      throw new BadRequestException('Mã giảm giá chưa bắt đầu hoặc đã hết hạn.');
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng.');
    }

    if (order.subtotal < promotion.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu phải từ ${promotion.minOrderValue.toLocaleString()}đ để dùng mã này.`,
      );
    }

    // 3. Tính số tiền giảm giá
    let discountAmount = 0;
    if (promotion.discountType === 'PERCENT') {
      discountAmount = Math.round((order.subtotal * promotion.value) / 100);
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount;
      }
    } else {
      discountAmount = promotion.value;
    }

    discountAmount = Math.min(discountAmount, order.subtotal);
    const newTotal = Math.max(0, order.subtotal - discountAmount);

    // 4. Cập nhật Order trong DB
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        promotionId: promotion.id,
        discount: discountAmount,
        total: newTotal,
      },
      include: {
        items: true,
        promotion: true,
      },
    });
  }

  // Gỡ khuyến mãi khỏi đơn hàng
  async removePromotionFromOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        promotionId: null,
        discount: 0,
        total: order.subtotal,
      },
      include: {
        items: true,
      },
    });
  }
}