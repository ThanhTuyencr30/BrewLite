
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const prisma = {
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      prisma as unknown as PrismaService,
    );
  });

  it('creates a payment for an existing order', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.payment.create.mockResolvedValue(payment);

    await expect(service.create(userId, dto)).resolves.toEqual(payment);

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

    await expect(service.create(userId, dto)).resolves.toEqual(payment);

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

    await expect(service.create(userId, dto)).resolves.toEqual(payment);
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
});
