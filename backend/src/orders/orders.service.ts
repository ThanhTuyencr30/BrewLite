import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../generated/prisma/enums';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private generateOrderCode(): string {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `CC-${randomNum}`;
  }

  // 1. Hàm lấy chi tiết đơn hàng (Dành cho màn hình 27 & 31)
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            toppings: true,
          },
        },
        promotion: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    return order;
  }

  // 2. Hàm tạo đơn hàng
  async createOrder(userId: string, dto: CreateOrderDto) {
    return await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const processedItems = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            sizes: true,
            toppingLinks: { include: { topping: true } },
          },
        });

        if (!product || !product.isAvailable) {
          throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại hoặc ngừng kinh doanh.`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Món "${product.name}" không đủ số lượng trong kho.`);
        }

        const sizeConfig = product.sizes.find((s) => s.size === item.size);
        const unitPrice = product.basePrice + (sizeConfig ? sizeConfig.additionalPrice : 0);
        let itemLineTotal = unitPrice * item.quantity;

        const validatedToppings = [];
        if (item.toppingIds && item.toppingIds.length > 0) {
          for (const toppingId of item.toppingIds) {
            const toppingLink = product.toppingLinks.find((tl) => tl.toppingId === toppingId);
            if (!toppingLink || !toppingLink.topping) {
              throw new BadRequestException(`Topping không hợp lệ cho sản phẩm ${product.name}`);
            }
            const topping = toppingLink.topping;
            if (topping.stock < item.quantity) {
              throw new BadRequestException(`Topping "${topping.name}" không đủ số lượng.`);
            }
            itemLineTotal += topping.price * item.quantity;
            validatedToppings.push({
              toppingId: topping.id,
              toppingName: topping.name,
              unitPrice: topping.price,
            });
          }
        }

        subtotal += itemLineTotal;
        processedItems.push({
          productId: product.id,
          productName: product.name,
          size: item.size,
          iceLevel: item.iceLevel || 'NORMAL',
          quantity: item.quantity,
          unitPrice,
          lineTotal: itemLineTotal,
          toppings: validatedToppings,
          productEntity: product,
        });
      }

      let discount = 0;
      let appliedPromotionId = null;
      if (dto.discountCode) {
        const promotion = await tx.promotion.findUnique({
          where: { code: dto.discountCode, isActive: true },
        });

        if (!promotion) {
          throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã hết hạn.');
        }

        if (subtotal < promotion.minOrderValue) {
          throw new BadRequestException(`Đơn hàng tối thiểu phải từ ${promotion.minOrderValue}đ để áp dụng.`);
        }

        if (promotion.discountType === 'PERCENT') {
          discount = Math.floor((subtotal * promotion.value) / 100);
          if (promotion.maxDiscount && discount > promotion.maxDiscount) {
            discount = promotion.maxDiscount;
          }
        } else {
          discount = promotion.value;
        }

        appliedPromotionId = promotion.id;
        await tx.promotion.update({
          where: { id: promotion.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const total = Math.max(0, subtotal - discount);

      // Trừ kho dùng Optimistic Locking (Kiểm tra version)
      for (const item of processedItems) {
        const prod = item.productEntity;
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: prod.id,
            version: prod.version,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            version: { increment: 1 },
          },
        });

        if (updatedProduct.count === 0) {
          throw new BadRequestException(`Xung đột dữ liệu tồn kho cho sản phẩm ${prod.name}. Vui lòng thử lại.`);
        }
      }

      const orderCode = this.generateOrderCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Quá hạn sau 15 phút

      const newOrder = await tx.order.create({
        data: {
          code: orderCode,
          userId,
          promotionId: appliedPromotionId,
          status: OrderStatus.PENDING,
          subtotal,
          discount,
          total,
          expiresAt,
          items: {
            create: processedItems.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              size: i.size,
              iceLevel: i.iceLevel,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
              toppings: {
                create: i.toppings.map((t) => ({
                  toppingId: t.toppingId,
                  toppingName: t.toppingName,
                  unitPrice: t.unitPrice,
                })),
              },
            })),
          },
          statusHistory: {
            create: {
              toStatus: OrderStatus.PENDING,
              note: 'Đơn hàng được khởi tạo, chờ thanh toán.',
            },
          },
        },
        include: { items: { include: { toppings: true } } },
      });

      return newOrder;
    });
  }
}