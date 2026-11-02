import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';

describe('ProductsService', () => {
  const findMany = jest.fn();
  const findFirst = jest.fn();
  const prisma = {
    product: { findMany, findFirst },
  } as unknown as PrismaService;
  const service = new ProductsService(prisma);

  beforeEach(() => {
    findMany.mockReset();
    findFirst.mockReset();
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

  it('returns detail with prices derived from database size prices', async () => {
    findFirst.mockResolvedValue({
      id: 1,
      name: 'Cà Phê Sữa',
      slug: 'ca-phe-sua-da',
      description: 'Cà phê sữa',
      basePrice: 22000,
      imageUrl: '/product-milk-coffee.jpeg',
      stock: 30,
      isAvailable: true,
      category: { id: 1, name: 'Cà phê', slug: 'ca-phe' },
      sizes: [
        { size: 'S', additionalPrice: 0 },
        { size: 'M', additionalPrice: 6000 },
        { size: 'L', additionalPrice: 14000 },
      ],
    });

    await expect(service.findOne(1)).resolves.toEqual({
      id: 1,
      name: 'Cà Phê Sữa',
      category: 'Cà phê',
      price: 22000,
      sizePrices: { S: 22000, M: 28000, L: 36000 },
      imageUrl: '/product-milk-coffee.jpeg',
      stock: 30,
      isAvailable: true,
    });
  });

  it('throws when the requested product does not exist', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(
      'Không tìm thấy sản phẩm có mã 999.',
    );
  });
});
