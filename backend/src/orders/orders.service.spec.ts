import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStateMachine } from './order-state-machine.service';
import { PrismaService } from '../database/prisma.service';

describe('OrdersService.createOrder', () => {
  const tx = {
    product: { findUnique: jest.fn(), updateMany: jest.fn() },
    promotion: { findUnique: jest.fn(), updateMany: jest.fn() },
    order: { create: jest.fn() },
  };
  const prisma = {
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  } as unknown as PrismaService;
  const service = new OrdersService(prisma, new OrderStateMachine());

  const americano = {
    id: 1,
    name: 'Americano',
    basePrice: 30000,
    stock: 10,
    version: 3,
    isAvailable: true,
    sizes: [{ size: 'M', additionalPrice: 5000 }],
    toppingLinks: [
      {
        toppingId: 7,
        topping: { id: 7, name: 'Trân châu', price: 5000, stock: 10, isAvailable: true },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tx.product.findUnique.mockResolvedValue(americano);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.promotion.updateMany.mockResolvedValue({ count: 1 });
    tx.order.create.mockImplementation(({ data }: { data: unknown }) => data);
  });

  it('creates a pending order with prices calculated on the server', async () => {
    const order = await service.createOrder('user-1', {
      items: [{ productId: 1, size: 'M', quantity: 2, toppingIds: [7] }],
    });

    expect(order).toMatchObject({
      userId: 'user-1',
      status: 'PENDING',
      subtotal: 80000,
      discount: 0,
      total: 80000,
      promotionId: null,
    });
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 1, version: 3, stock: { gte: 2 } },
      data: { stock: { decrement: 2 }, version: { increment: 1 } },
    });
  });

  it('applies a valid promotion and caps the discount', async () => {
    tx.promotion.findUnique.mockResolvedValue({
      id: 5,
      isActive: true,
      startsAt: new Date(Date.now() - 1000),
      endsAt: new Date(Date.now() + 60_000),
      minOrderValue: 0,
      discountType: 'PERCENT',
      value: 50,
      maxDiscount: 20000,
      usageLimit: 10,
    });

    const order = await service.createOrder('user-1', {
      items: [{ productId: 1, size: 'M', quantity: 2 }],
      discountCode: ' giam50 ',
    });

    expect(tx.promotion.findUnique).toHaveBeenCalledWith({ where: { code: 'GIAM50' } });
    expect(order).toMatchObject({ subtotal: 70000, discount: 20000, total: 50000, promotionId: 5 });
  });

  it('rejects a promotion that has reached its usage limit', async () => {
    tx.promotion.findUnique.mockResolvedValue({
      id: 5,
      isActive: true,
      startsAt: new Date(Date.now() - 1000),
      endsAt: new Date(Date.now() + 60_000),
      minOrderValue: 0,
      discountType: 'FIXED_AMOUNT',
      value: 10000,
      maxDiscount: null,
      usageLimit: 1,
    });
    tx.promotion.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.createOrder('user-1', {
        items: [{ productId: 1, size: 'M', quantity: 1 }],
        discountCode: 'GIAM10',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('retries with a new order code when the code is already taken', async () => {
    tx.order.create
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockImplementationOnce(({ data }: { data: unknown }) => data);

    const order = await service.createOrder('user-1', {
      items: [{ productId: 1, size: 'M', quantity: 1 }],
    });

    expect(order).toMatchObject({ status: 'PENDING', total: 35000 });
    expect(tx.order.create).toHaveBeenCalledTimes(2);
  });

  it('rejects unavailable products and unknown sizes', async () => {
    tx.product.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.createOrder('user-1', { items: [{ productId: 9, size: 'M', quantity: 1 }] }),
    ).rejects.toThrow(NotFoundException);

    await expect(
      service.createOrder('user-1', { items: [{ productId: 1, size: 'L', quantity: 1 }] }),
    ).rejects.toThrow(BadRequestException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });
});

describe('OrdersService.cancelOrder', () => {
  const tx = {
    order: { updateMany: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    product: { update: jest.fn() },
    payment: { update: jest.fn() },
    promotion: { updateMany: jest.fn() },
    user: { update: jest.fn(), updateMany: jest.fn() },
  };
  const findUnique = jest.fn();
  const prisma = {
    order: { findUnique },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  } as unknown as PrismaService;
  const service = new OrdersService(prisma, new OrderStateMachine());

  it('releases the promotion usage when an order is cancelled', async () => {
    findUnique.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: 'PENDING',
      version: 0,
      promotionId: 5,
      items: [{ productId: 1, quantity: 1 }],
      payments: [],
    });
    tx.order.updateMany.mockResolvedValue({ count: 1 });

    await service.cancelOrder('order-1', 'user-1');

    expect(tx.promotion.updateMany).toHaveBeenCalledWith({
      where: { id: 5, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  });

  it('refunds a paid order and takes back its loyalty points', async () => {
    findUnique.mockResolvedValue({
      id: 'order-2',
      userId: 'user-1',
      status: 'PAID',
      version: 1,
      total: 68000,
      promotionId: null,
      items: [],
      payments: [{ id: 'pay-1', status: 'SUCCEEDED' }],
    });
    tx.order.updateMany.mockResolvedValue({ count: 1 });
    tx.user.updateMany.mockResolvedValue({ count: 1 });

    await service.cancelOrder('order-2', 'user-1');

    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: 'REFUNDED' },
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', loyaltyPoints: { gte: 6 } },
      data: { loyaltyPoints: { decrement: 6 } },
    });
  });
});
