import { BadRequestException } from '@nestjs/common';
import { DiscountType } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { PromotionsService } from './promotions.service';

describe('PromotionsService', () => {
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const validateCart = jest.fn();
  const prisma = {
    promotion: { findMany, findUnique },
  } as unknown as PrismaService;
  const cartService = { validateCart } as unknown as CartService;
  const service = new PromotionsService(prisma, cartService);

  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
    validateCart.mockReset();
  });

  it('lists promotions with the eligibility status for each code', async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        code: 'GIAM15',
        description: 'Giảm 15%',
        discountType: DiscountType.PERCENT,
        value: 15,
        minOrderValue: 50000,
        maxDiscount: 30000,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 60_000),
        usageLimit: 10,
        usedCount: 4,
      },
      {
        id: 2,
        code: 'FULL',
        description: null,
        discountType: DiscountType.FIXED_AMOUNT,
        value: 10000,
        minOrderValue: 0,
        maxDiscount: null,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 60_000),
        usageLimit: 1,
        usedCount: 1,
      },
    ]);

    await expect(service.findAvailable()).resolves.toEqual([
      expect.objectContaining({ code: 'GIAM15', isAvailable: true }),
      expect.objectContaining({
        code: 'FULL',
        isAvailable: false,
        availabilityMessage: 'Mã giảm giá đã hết lượt sử dụng.',
      }),
    ]);
  });

  it('applies percentage discounts with the configured cap', async () => {
    findUnique.mockResolvedValue({
      id: 1,
      code: 'GIAM15',
      description: 'Giảm 15%',
      discountType: DiscountType.PERCENT,
      value: 15,
      minOrderValue: 50000,
      maxDiscount: 10000,
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 60_000),
      usageLimit: 5,
      usedCount: 1,
      isActive: true,
    });
    validateCart.mockResolvedValue({ valid: true, subtotal: 100000, issues: [] });

    await expect(
      service.validate({
        code: 'giam15',
        items: [{ productId: 1, size: 'S', quantity: 2, expectedUnitPrice: 50000 }],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        valid: true,
        discount: 10000,
        subtotal: 100000,
        total: 90000,
      }),
    );
  });

  it('rejects promotions when the order minimum is not met', async () => {
    findUnique.mockResolvedValue({
      id: 1,
      code: 'GIAM15',
      description: null,
      discountType: DiscountType.PERCENT,
      value: 15,
      minOrderValue: 100000,
      maxDiscount: null,
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() + 60_000),
      usageLimit: null,
      usedCount: 0,
      isActive: true,
    });
    validateCart.mockResolvedValue({ valid: true, subtotal: 50000, issues: [] });

    await expect(
      service.validate({
        code: 'GIAM15',
        items: [{ productId: 1, size: 'S', quantity: 1, expectedUnitPrice: 50000 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
