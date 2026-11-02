
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStateMachine } from '../orders/order-state-machine.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { DECLINED_TEST_CARD, PaymentsService, QR_VALIDITY_MS } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const tx = {
    payment: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    order: { updateMany: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    user: { update: jest.fn() },
  };

  const prisma = {
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  };

  const dto: CreatePaymentDto = {
    orderId: '12def5a2-fc8d-4d1c-bef5-a41b3c35b498',
    idempotencyKey: 'test-payment-001',
    method: 'QR',
  };

  const userId = '5b0f5d0e-3a43-4a8e-9a55-1d6f7e1c2b3a';

  const order = {
    id: dto.orderId,
    userId,
    status: 'PENDING',
    total: 35000,
  };

  const payment = {
    id: 'ca84f7be-d75d-4dbd-b194-5f73518ec283',
    orderId: dto.orderId,
    idempotencyKey: dto.idempotencyKey,
    method: 'QR',
    status: 'PENDING',
    amount: 35000,
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      prisma as unknown as PrismaService,
      new OrderStateMachine(),
    );
  });

  it('creates a payment for an existing order', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.payment.create.mockResolvedValue(payment);

    await expect(service.create(userId, dto)).resolves.toMatchObject(payment);

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: dto.orderId,
        idempotencyKey: dto.idempotencyKey,
        method: 'QR',
        amount: 35000,
        status: 'PENDING',
      },
    });
  });

  it('returns the existing payment for the same request', async () => {
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.payment.findUnique.mockResolvedValue(payment);

    await expect(service.create(userId, dto)).resolves.toMatchObject(payment);

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it("hides orders that belong to another user", async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, userId: 'other-user' });

    await expect(service.create(userId, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('rejects payment for an order that is no longer awaiting payment', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, status: 'CANCELLED' });
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(service.create(userId, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('rejects reuse of a key with a different method', async () => {
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.payment.findUnique.mockResolvedValue(payment);

    await expect(
      service.create(userId, { ...dto, method: 'CARD' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('rejects reuse of a key with a different order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...order,
      id: '00000000-0000-4000-8000-000000000099',
    });
    prisma.payment.findUnique.mockResolvedValue(payment);

    await expect(
      service.create(userId, {
        ...dto,
        orderId: '00000000-0000-4000-8000-000000000099',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the order does not exist', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(service.create(userId, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('returns the existing payment if a concurrent request uses the same key', async () => {
    prisma.payment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment);

    prisma.order.findUnique.mockResolvedValue(order);
    prisma.payment.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create(userId, dto)).resolves.toMatchObject(payment);
  });

  it('rejects a concurrent request if the key belongs to a different request', async () => {
    prisma.payment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment);

    prisma.order.findUnique.mockResolvedValue(order);
    prisma.payment.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create(userId, { ...dto, method: 'CARD' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('simulated gateway', () => {
    const userIdOrder = { ...order, version: 0, userId };

    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(userIdOrder);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.create.mockImplementation(({ data }: { data: object }) => ({
        ...payment,
        ...data,
      }));
      tx.order.updateMany.mockResolvedValue({ count: 1 });
      tx.payment.updateMany.mockResolvedValue({ count: 1 });
    });

    it('marks wallet payments as paid and awards loyalty points', async () => {
      tx.payment.findUniqueOrThrow
        .mockResolvedValueOnce({ ...payment, method: 'WALLET', order: userIdOrder })
        .mockResolvedValueOnce({ ...payment, method: 'WALLET', status: 'SUCCEEDED' });

      const result = await service.create(userId, { ...dto, method: 'WALLET' });

      expect(result).toMatchObject({ status: 'SUCCEEDED', rewardPoints: 3 });
      expect(tx.order.updateMany).toHaveBeenCalledWith({
        where: { id: order.id, version: 0 },
        data: { status: 'PAID', version: { increment: 1 } },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { loyaltyPoints: { increment: 3 } },
      });
    });

    it('moves a previously failed order back through PENDING before PAID', async () => {
      const failedOrder = { ...userIdOrder, status: 'PAYMENT_FAILED' };
      prisma.order.findUnique.mockResolvedValue(failedOrder);
      tx.payment.findUniqueOrThrow
        .mockResolvedValueOnce({ ...payment, method: 'WALLET', order: failedOrder })
        .mockResolvedValueOnce({ ...payment, method: 'WALLET', status: 'SUCCEEDED' });

      await service.create(userId, { ...dto, method: 'WALLET' });

      expect(tx.orderStatusHistory.create).toHaveBeenCalledTimes(2);
    });

    it('declines the test card and marks the order as payment failed', async () => {
      tx.payment.update.mockResolvedValue({
        ...payment,
        method: 'CARD',
        status: 'FAILED',
        failureReason: 'Thẻ bị ngân hàng từ chối.',
        order: userIdOrder,
      });

      const result = await service.create(userId, {
        ...dto,
        method: 'CARD',
        cardNumber: DECLINED_TEST_CARD,
      });

      expect(result).toMatchObject({ status: 'FAILED', rewardPoints: 0 });
      expect(result).not.toHaveProperty('order');
      expect(tx.order.updateMany).toHaveBeenCalledWith({
        where: { id: order.id, version: 0 },
        data: { status: 'PAYMENT_FAILED', version: { increment: 1 } },
      });
    });

    it('keeps QR payments pending with a 15 minute expiry', async () => {
      const result = await service.create(userId, dto);

      expect(result.status).toBe('PENDING');
      expect(result.qrExpiresAt?.getTime()).toBe(payment.createdAt.getTime() + QR_VALIDITY_MS);
      expect(tx.order.updateMany).not.toHaveBeenCalled();
    });

    it('rejects confirming an expired QR code', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...payment,
        createdAt: new Date(Date.now() - QR_VALIDITY_MS - 1000),
        order: userIdOrder,
      });

      await expect(service.confirmQr(userId, payment.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'FAILED', failureReason: 'Mã QR đã hết hạn.' },
      });
    });
  });
});
