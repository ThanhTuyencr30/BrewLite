import { BadRequestException, Injectable } from '@nestjs/common';
import { DiscountType } from '../generated/prisma/client';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../database/prisma.service';
import type { ValidatePromotionDto } from './dto/validate-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async findAvailable() {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        value: true,
        minOrderValue: true,
        maxDiscount: true,
        startsAt: true,
        endsAt: true,
        usageLimit: true,
        usedCount: true,
      },
      orderBy: { endsAt: 'asc' },
    });
    return promotions.map((promotion) => {
      const isExhausted =
        promotion.usageLimit !== null &&
        promotion.usedCount >= promotion.usageLimit;
      const isAvailable =
        promotion.startsAt <= now &&
        promotion.endsAt > now &&
        !isExhausted;
      const availabilityMessage = isExhausted
        ? 'Mã giảm giá đã hết lượt sử dụng.'
        : promotion.startsAt > now
          ? 'Mã giảm giá chưa có hiệu lực.'
          : promotion.endsAt <= now
            ? `Mã ${promotion.code} đã hết hạn sử dụng.`
            : null;

      return {
        id: promotion.id,
        code: promotion.code,
        description: promotion.description,
        discountType: promotion.discountType,
        value: promotion.value,
        minOrderValue: promotion.minOrderValue,
        maxDiscount: promotion.maxDiscount,
        startsAt: promotion.startsAt,
        endsAt: promotion.endsAt,
        isAvailable,
        availabilityMessage,
      };
    });
  }

  async validate(input: ValidatePromotionDto) {
    const now = new Date();
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: input.code.trim().toUpperCase() },
    });

    if (
      !promotion ||
      !promotion.isActive ||
      promotion.startsAt > now ||
      promotion.endsAt <= now
    ) {
      throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }

    const cart = await this.cartService.validateCart({ items: input.items });
    if (!cart.valid) {
      throw new BadRequestException(
        cart.issues.map((issue) => issue.message).join(' '),
      );
    }

    if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng.');
    }

    if (cart.subtotal < promotion.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng cần đạt tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này.`,
      );
    }

    const rawDiscount =
      promotion.discountType === DiscountType.PERCENT
        ? Math.floor((cart.subtotal * promotion.value) / 100)
        : promotion.value;
    const discount = Math.min(
      cart.subtotal,
      promotion.maxDiscount === null
        ? rawDiscount
        : Math.min(rawDiscount, promotion.maxDiscount),
    );

    return {
      valid: true as const,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        description: promotion.description,
        discountType: promotion.discountType,
        value: promotion.value,
        minOrderValue: promotion.minOrderValue,
        maxDiscount: promotion.maxDiscount,
        startsAt: promotion.startsAt,
        endsAt: promotion.endsAt,
        isAvailable: true,
        availabilityMessage: null,
      },
      discount,
      subtotal: cart.subtotal,
      total: cart.subtotal - discount,
    };
  }
}
