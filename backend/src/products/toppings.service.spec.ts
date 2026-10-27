import { ToppingsService } from './toppings.service';
import { PrismaService } from '../database/prisma.service';

describe('ToppingsService', () => {
  const findMany = jest.fn();
  const prisma = { topping: { findMany } } as unknown as PrismaService;
  const service = new ToppingsService(prisma);

  beforeEach(() => {
    findMany.mockReset();
  });

  it('returns available toppings with numeric identifiers', async () => {
    findMany.mockResolvedValue([
      { id: 1, name: 'Trân châu đen', price: 5000, isAvailable: true },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, name: 'Trân châu đen', price: 5000, isAvailable: true },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isAvailable: true, stock: { gt: 0 } },
      }),
    );
  });
});
