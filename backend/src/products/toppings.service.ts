import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface Topping {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

@Injectable()
export class ToppingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Topping[]> {
    const toppings = await this.prisma.topping.findMany({
      where: { isAvailable: true, stock: { gt: 0 } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, price: true, isAvailable: true },
    });

    return toppings;
  }
}
