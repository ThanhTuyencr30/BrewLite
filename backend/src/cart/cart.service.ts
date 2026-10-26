import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { ValidateCartDto } from './dto/validate-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCart(input: ValidateCartDto) {
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        basePrice: true,
        stock: true,
        isAvailable: true,
        sizes: { select: { size: true, additionalPrice: true } },
      },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));
    const requestedByProductId = new Map<number, number>();
    for (const item of input.items) {
      requestedByProductId.set(
        item.productId,
        (requestedByProductId.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const issues: {
      productId: number;
      reason: 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'PRICE_CHANGED';
      message: string;
      productName: string;
      requestedQuantity: number;
      availableStock: number;
    }[] = [];
    const productsWithReportedStock = new Set<number>();
    let subtotal = 0;
    const items = input.items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        issues.push({
          productId: item.productId,
          reason: 'UNAVAILABLE',
          message: 'Một món trong giỏ hàng không còn tồn tại.',
          productName: 'Món không còn tồn tại',
          requestedQuantity: item.quantity,
          availableStock: 0,
        });
        return {
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          currentUnitPrice: 0,
          availableStock: 0,
          priceChanged: true,
        };
      }

      const size = product.sizes.find((option) => option.size === item.size);
      if (!product.isAvailable || !size) {
        issues.push({
          productId: item.productId,
          reason: 'UNAVAILABLE',
          message: `${product.name} hiện không khả dụng.`,
          productName: product.name,
          requestedQuantity: requestedByProductId.get(product.id) ?? item.quantity,
          availableStock: 0,
        });
      }

      const currentUnitPrice = product.basePrice + (size?.additionalPrice ?? 0);
      const priceChanged = currentUnitPrice !== item.expectedUnitPrice;
      const availableStock = product.isAvailable ? product.stock : 0;
      if (
        product.isAvailable &&
        size &&
        !productsWithReportedStock.has(product.id) &&
        (requestedByProductId.get(product.id) ?? 0) > availableStock
      ) {
        productsWithReportedStock.add(product.id);
        issues.push({
          productId: product.id,
          reason: 'OUT_OF_STOCK',
          message:
            availableStock > 0
              ? `${product.name} chỉ còn ${availableStock} món.`
              : `${product.name} hiện đã hết hàng.`,
          productName: product.name,
          requestedQuantity: requestedByProductId.get(product.id) ?? item.quantity,
          availableStock,
        });
      }
      if (priceChanged) {
        issues.push({
          productId: product.id,
          reason: 'PRICE_CHANGED',
          message: `Giá ${product.name} đã thay đổi thành ${currentUnitPrice.toLocaleString('vi-VN')}đ.`,
          productName: product.name,
          requestedQuantity: requestedByProductId.get(product.id) ?? item.quantity,
          availableStock,
        });
      }

      subtotal += currentUnitPrice * item.quantity;
      return {
        productId: product.id,
        size: item.size,
        quantity: item.quantity,
        currentUnitPrice,
        availableStock,
        priceChanged,
      };
    });

    return { valid: issues.length === 0, subtotal, items, issues };
  }
}
