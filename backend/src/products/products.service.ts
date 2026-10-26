import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  imageUrl: true,
  stock: true,
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

export interface FindProductsQuery {
  search?: string;
  category?: string;
}

export interface ProductSummary extends ProductRecord {
  price: number;
  isOutOfStock: boolean;
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
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
    });

    return products.map((product) => this.toSummary(product));
  }

  private toSummary(product: ProductRecord): ProductSummary {
    return {
      ...product,
      price: product.basePrice,
      isOutOfStock: product.stock <= 0,
    };
  }
}
