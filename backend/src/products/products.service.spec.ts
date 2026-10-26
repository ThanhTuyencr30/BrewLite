import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';

describe('ProductsService', () => {
  const findMany = jest.fn();
  const prisma = {
    product: { findMany },
  } as unknown as PrismaService;
  const service = new ProductsService(prisma);

  beforeEach(() => {
    findMany.mockReset();
  });

  it('marks a product with no stock as out of stock', async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Cold Brew',
        slug: 'cold-brew',
        description: 'Cà phê ủ lạnh',
        basePrice: 49000,
        imageUrl: 'https://example.com/cold-brew.jpg',
        stock: 0,
        category: { id: 1, name: 'Cà phê', slug: 'ca-phe' },
        sizes: [],
      },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({
        id: 1,
        price: 49000,
        isOutOfStock: true,
      }),
    ]);
  });

  it('passes search and category filters to Prisma', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll({ search: '  đào  ', category: 'tra-trai-cay' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: expect.objectContaining({ slug: 'tra-trai-cay' }),
          OR: expect.arrayContaining([
            { name: { contains: 'đào', mode: 'insensitive' } },
          ]),
        }),
      }),
    );
  });
});
