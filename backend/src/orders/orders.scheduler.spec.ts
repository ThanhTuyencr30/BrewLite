import { OrdersScheduler } from './orders.scheduler';
import { PrismaService } from '../database/prisma.service';

describe('OrdersScheduler', () => {
  const tx = {
    order: { updateMany: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    product: { update: jest.fn() },
  };
  const findMany = jest.fn();
  const prisma = {
    order: { findMany },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  } as unknown as PrismaService;
  const scheduler = new OrdersScheduler(prisma);
  const expiredOrder = {
    id: 'order-1',
    version: 0,
    items: [{ productId: 1, quantity: 2 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([expiredOrder]);
  });

  it('cancels expired pending orders and restores stock', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 1 });

    await scheduler.handleExpiredOrders();

    expect(tx.orderStatusHistory.create).toHaveBeenCalled();
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { increment: 2 } },
    });
  });

  it('skips orders that changed status before cancellation', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    await scheduler.handleExpiredOrders();

    expect(tx.orderStatusHistory.create).not.toHaveBeenCalled();
    expect(tx.product.update).not.toHaveBeenCalled();
  });
});
