import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

export type ProductSize = 'S' | 'M' | 'L';

export interface ProductSizePrices {
  S: number;
  M: number;
  L: number;
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  imageUrl: true,
  stock: true,
  isAvailable: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  sizes: {
    select: {
      size: true,
      additionalPrice: true,
    },
    orderBy: {
      additionalPrice: 'asc',
    },
  },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

const menuOrder = new Map(
  [
    'ca-phe-sua', 'cappuccino', 'americano', 'caramel-macchiato', 'mocha', 'ca-phe-muoi',
    'choco-latte', 'matcha-latte', 'freeze-chocolate', 'freeze-matcha',
    'tra-cuc-sen-vang', 'tra-oi-hong', 'tra-vai', 'tra-dao', 'tra-xanh-dau-do', 'tra-dao-cam-sa',
    'tra-olong-sua-nhai', 'tra-olong-sua-dua', 'tra-sua-truyen-thong', 'tra-sua-hongkong',
    'tra-sua-matcha', 'tra-sua-duong-den', 'soda-viet-quoc', 'soda-dau', 'soda-chanh',
    'soda-bac-ha', 'soda-chanh-day',
  ].map((slug, index) => [slug, index]),
);

export interface FindProductsQuery {
  search?: string;
  category?: string;
}

export interface ProductSummary extends ProductRecord {
  price: number;
  isOutOfStock: boolean;
  sizePrices: ProductSizePrices;
}

export interface ProductDetails {
  id: number;
  name: string;
  category: string;
  price: number;
  sizePrices: ProductSizePrices;
  imageUrl: string;
  stock: number;
  isAvailable: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindProductsQuery = {}): Promise<ProductSummary[]> {
    const search = query.search?.trim();
    const category = query.category?.trim();

    const products = await this.prisma.product.findMany({
      where: {
        isAvailable: true,
        category: {
          isActive: true,
          ...(category && category !== 'all' ? { slug: category } : {}),
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: productSelect,
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });

    return products
      .map((product) => this.toSummary(product))
      .sort(
        (left, right) =>
          (menuOrder.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
          (menuOrder.get(right.slug) ?? Number.MAX_SAFE_INTEGER),
      );
  }

  async findOne(id: number): Promise<ProductDetails> {
    const product = await this.prisma.product.findFirst({
      where: { id, isAvailable: true },
      select: productSelect,
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có mã ${id}.`);
    }

    return {
      id: product.id,
      name: product.name,
      category: product.category.name,
      price: product.basePrice,
      sizePrices: this.toSizePrices(product),
      imageUrl: product.imageUrl,
      stock: product.stock,
      isAvailable: product.isAvailable,
    };
  }

  private toSummary(product: ProductRecord): ProductSummary {
    return {
      ...product,
      price: product.basePrice,
      isOutOfStock: product.stock <= 0,
      sizePrices: this.toSizePrices(product),
    };
  }

  private toSizePrices(product: ProductRecord): ProductSizePrices {
    const prices: ProductSizePrices = {
      S: product.basePrice,
      M: product.basePrice,
      L: product.basePrice,
    };

    for (const size of product.sizes) {
      prices[size.size] = product.basePrice + size.additionalPrice;
    }

    return prices;
  }
}
