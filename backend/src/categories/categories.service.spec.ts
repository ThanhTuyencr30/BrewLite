import { PrismaService } from '../database/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  it('maps the available product count', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Cà phê',
        slug: 'ca-phe',
        _count: { products: 8 },
      },
    ]);
    const prisma = {
      category: { findMany },
    } as unknown as PrismaService;
    const service = new CategoriesService(prisma);

    await expect(service.findAll()).resolves.toEqual([
      { id: 1, name: 'Cà phê', slug: 'ca-phe', productCount: 8 },
    ]);
  });
});
