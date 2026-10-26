import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SizeCode } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categories = [
  { name: 'Cà phê', slug: 'ca-phe', sortOrder: 1, isActive: true },
  { name: 'Latte', slug: 'latte', sortOrder: 2, isActive: true },
  { name: 'Freeze', slug: 'freeze', sortOrder: 3, isActive: true },
  { name: 'Trà', slug: 'tra', sortOrder: 4, isActive: true },
  { name: 'Trà sữa', slug: 'tra-sua', sortOrder: 5, isActive: true },
  { name: 'Soda', slug: 'soda', sortOrder: 6, isActive: true },
] as const;

const toppings = [
  { name: 'Trân châu đen', slug: 'tran-chau-den', price: 7000, stock: 120 },
  { name: 'Trân châu trắng', slug: 'tran-chau-trang', price: 8000, stock: 100 },
  { name: 'Thạch cà phê', slug: 'thach-ca-phe', price: 7000, stock: 80 },
  { name: 'Thạch đào', slug: 'thach-dao', price: 8000, stock: 90 },
  { name: 'Kem cheese', slug: 'kem-cheese', price: 10000, stock: 70 },
  { name: 'Pudding trứng', slug: 'pudding-trung', price: 9000, stock: 75 },
  { name: 'Shot espresso', slug: 'shot-espresso', price: 12000, stock: 100 },
  { name: 'Kem tươi', slug: 'kem-tuoi', price: 10000, stock: 60 },
] as const;

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  categorySlug: (typeof categories)[number]['slug'];
  basePrice: number;
  imageUrl: string;
  stock: number;
  toppingSlugs: string[];
};

const products: ProductSeed[] = [
  {
    name: 'Cà phê sữa đá',
    slug: 'ca-phe-sua-da',
    description: 'Cà phê đậm vị hòa cùng sữa đặc, phục vụ với đá.',
    categorySlug: 'ca-phe',
    basePrice: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    stock: 40,
    toppingSlugs: ['thach-ca-phe', 'shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Cà phê đen đá',
    slug: 'ca-phe-den-da',
    description: 'Cà phê rang xay nguyên chất, mạnh mẽ và tỉnh táo.',
    categorySlug: 'ca-phe',
    basePrice: 30000,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    stock: 35,
    toppingSlugs: ['thach-ca-phe', 'shot-espresso'],
  },
  {
    name: 'Bạc xỉu',
    slug: 'bac-xiu',
    description: 'Sữa thơm béo với một chút cà phê dịu nhẹ.',
    categorySlug: 'ca-phe',
    basePrice: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
    stock: 28,
    toppingSlugs: ['thach-ca-phe', 'shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Americano',
    slug: 'americano',
    description: 'Espresso pha cùng nước nóng, vị cân bằng và thanh.',
    categorySlug: 'ca-phe',
    basePrice: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    toppingSlugs: ['shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Cappuccino',
    slug: 'cappuccino',
    description: 'Espresso, sữa nóng và lớp bọt sữa mịn màng.',
    categorySlug: 'ca-phe',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
    stock: 24,
    toppingSlugs: ['shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Latte',
    slug: 'latte',
    description: 'Cà phê sữa kiểu Ý dịu nhẹ, thơm và béo.',
    categorySlug: 'ca-phe',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=800&q=80',
    stock: 22,
    toppingSlugs: ['shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Mocha',
    slug: 'mocha',
    description: 'Espresso hòa quyện chocolate và sữa tươi.',
    categorySlug: 'ca-phe',
    basePrice: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    toppingSlugs: ['shot-espresso', 'kem-tuoi', 'thach-ca-phe'],
  },
  {
    name: 'Cold Brew',
    slug: 'cold-brew',
    description: 'Cà phê ủ lạnh 12 giờ, hậu vị ngọt tự nhiên.',
    categorySlug: 'ca-phe',
    basePrice: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    stock: 0,
    toppingSlugs: ['shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Trà đào cam sả',
    slug: 'tra-dao-cam-sa',
    description: 'Trà đào thơm mát cùng cam vàng và sả tươi.',
    categorySlug: 'tra-trai-cay',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=800&q=80',
    stock: 32,
    toppingSlugs: ['thach-dao', 'tran-chau-trang', 'kem-cheese'],
  },
  {
    name: 'Trà vải',
    slug: 'tra-vai',
    description: 'Trà thanh nhẹ kết hợp vải mọng nước.',
    categorySlug: 'tra-trai-cay',
    basePrice: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    stock: 26,
    toppingSlugs: ['thach-dao', 'tran-chau-trang'],
  },
  {
    name: 'Trà dâu',
    slug: 'tra-dau',
    description: 'Trà trái cây chua ngọt với dâu tươi.',
    categorySlug: 'tra-trai-cay',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    toppingSlugs: ['thach-dao', 'tran-chau-trang', 'kem-cheese'],
  },
  {
    name: 'Trà chanh dây',
    slug: 'tra-chanh-day',
    description: 'Vị chanh dây nhiệt đới nổi bật trên nền trà thanh mát.',
    categorySlug: 'tra-trai-cay',
    basePrice: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    toppingSlugs: ['thach-dao', 'tran-chau-trang'],
  },
  {
    name: 'Trà tắc mật ong',
    slug: 'tra-tac-mat-ong',
    description: 'Trà tắc chua dịu, cân bằng bằng mật ong thơm.',
    categorySlug: 'tra-trai-cay',
    basePrice: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
    stock: 36,
    toppingSlugs: ['thach-dao', 'tran-chau-trang'],
  },
  {
    name: 'Trà nhiệt đới',
    slug: 'tra-nhiet-doi',
    description: 'Hỗn hợp trà, dứa, cam và chanh dây tươi mát.',
    categorySlug: 'tra-trai-cay',
    basePrice: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
    stock: 0,
    toppingSlugs: ['thach-dao', 'tran-chau-trang', 'kem-cheese'],
  },
  {
    name: 'Trà ô long sen',
    slug: 'tra-o-long-sen',
    description: 'Ô long hương sen thanh tao, ít ngọt.',
    categorySlug: 'tra-trai-cay',
    basePrice: 43000,
    imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80',
    stock: 21,
    toppingSlugs: ['tran-chau-trang', 'kem-cheese'],
  },
  {
    name: 'Trà sữa truyền thống',
    slug: 'tra-sua-truyen-thong',
    description: 'Trà đen đậm hương hòa cùng sữa béo nhẹ.',
    categorySlug: 'tra-sua',
    basePrice: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1525803377221-4f6ccdaa5133?auto=format&fit=crop&w=800&q=80',
    stock: 42,
    toppingSlugs: ['tran-chau-den', 'tran-chau-trang', 'pudding-trung', 'kem-cheese'],
  },
  {
    name: 'Trà sữa ô long',
    slug: 'tra-sua-o-long',
    description: 'Trà ô long rang thơm kết hợp sữa dịu.',
    categorySlug: 'tra-sua',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
    stock: 31,
    toppingSlugs: ['tran-chau-den', 'tran-chau-trang', 'pudding-trung', 'kem-cheese'],
  },
  {
    name: 'Trà sữa matcha',
    slug: 'tra-sua-matcha',
    description: 'Matcha thơm dịu, sữa tươi và vị ngọt cân bằng.',
    categorySlug: 'tra-sua',
    basePrice: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    toppingSlugs: ['tran-chau-den', 'tran-chau-trang', 'pudding-trung', 'kem-cheese'],
  },
  {
    name: 'Trà sữa khoai môn',
    slug: 'tra-sua-khoai-mon',
    description: 'Khoai môn bùi thơm quyện cùng nền trà sữa.',
    categorySlug: 'tra-sua',
    basePrice: 47000,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    stock: 16,
    toppingSlugs: ['tran-chau-den', 'pudding-trung', 'kem-cheese'],
  },
  {
    name: 'Trà sữa chocolate',
    slug: 'tra-sua-chocolate',
    description: 'Chocolate đậm đà hòa cùng trà sữa thơm béo.',
    categorySlug: 'tra-sua',
    basePrice: 47000,
    imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80',
    stock: 0,
    toppingSlugs: ['tran-chau-den', 'pudding-trung', 'kem-cheese'],
  },
  {
    name: 'Trà sữa đường đen',
    slug: 'tra-sua-duong-den',
    description: 'Sữa tươi, trà và trân châu đường đen nấu mới.',
    categorySlug: 'tra-sua',
    basePrice: 52000,
    imageUrl: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=800&q=80',
    stock: 27,
    toppingSlugs: ['tran-chau-den', 'pudding-trung', 'kem-cheese'],
  },
  {
    name: 'Cà phê đá xay',
    slug: 'ca-phe-da-xay',
    description: 'Cà phê xay cùng đá, phủ kem tươi mát lạnh.',
    categorySlug: 'da-xay',
    basePrice: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=800&q=80',
    stock: 19,
    toppingSlugs: ['thach-ca-phe', 'shot-espresso', 'kem-tuoi'],
  },
  {
    name: 'Chocolate đá xay',
    slug: 'chocolate-da-xay',
    description: 'Chocolate nguyên vị xay mịn cùng đá và kem tươi.',
    categorySlug: 'da-xay',
    basePrice: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80',
    stock: 23,
    toppingSlugs: ['tran-chau-den', 'pudding-trung', 'kem-tuoi'],
  },
  {
    name: 'Matcha đá xay',
    slug: 'matcha-da-xay',
    description: 'Matcha Nhật xay mịn, vị thanh và lớp kem béo.',
    categorySlug: 'da-xay',
    basePrice: 59000,
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80',
    stock: 17,
    toppingSlugs: ['tran-chau-trang', 'pudding-trung', 'kem-tuoi'],
  },
  {
    name: 'Cookies đá xay',
    slug: 'cookies-da-xay',
    description: 'Bánh quy chocolate xay cùng sữa và kem tươi.',
    categorySlug: 'da-xay',
    basePrice: 59000,
    imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    stock: 14,
    toppingSlugs: ['tran-chau-den', 'pudding-trung', 'kem-tuoi'],
  },
  {
    name: 'Dâu đá xay',
    slug: 'dau-da-xay',
    description: 'Dâu chua ngọt xay lạnh cùng sữa chua.',
    categorySlug: 'da-xay',
    basePrice: 57000,
    imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
    stock: 0,
    toppingSlugs: ['tran-chau-trang', 'thach-dao', 'kem-tuoi'],
  },
  {
    name: 'Sữa tươi đường đen',
    slug: 'sua-tuoi-duong-den',
    description: 'Sữa tươi thanh mát cùng đường đen và trân châu.',
    categorySlug: 'khac',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1576186726580-a8b1f5a4b57f?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    toppingSlugs: ['tran-chau-den', 'pudding-trung'],
  },
  {
    name: 'Matcha latte',
    slug: 'matcha-latte',
    description: 'Matcha Nhật hòa cùng sữa tươi nóng hoặc lạnh.',
    categorySlug: 'khac',
    basePrice: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    toppingSlugs: ['tran-chau-trang', 'pudding-trung', 'kem-tuoi'],
  },
  {
    name: 'Chocolate nóng',
    slug: 'chocolate-nong',
    description: 'Chocolate nóng đậm vị, ấm áp và thơm béo.',
    categorySlug: 'khac',
    basePrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    toppingSlugs: ['pudding-trung', 'kem-tuoi'],
  },
  {
    name: 'Nước ép cam',
    slug: 'nuoc-ep-cam',
    description: 'Cam tươi ép nguyên chất, không phẩm màu.',
    categorySlug: 'khac',
    basePrice: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    toppingSlugs: ['thach-dao', 'tran-chau-trang'],
  },
];

const designMenu: Array<{
  name: string;
  slug: string;
  categorySlug: (typeof categories)[number]['slug'];
  basePrice: number;
  stock?: number;
}> = [
  { name: 'Cà Phê Sữa', slug: 'ca-phe-sua', categorySlug: 'ca-phe', basePrice: 28000, stock: 0 },
  { name: 'Cappuccino', slug: 'cappuccino', categorySlug: 'ca-phe', basePrice: 40000 },
  { name: 'Americano', slug: 'americano', categorySlug: 'ca-phe', basePrice: 32000 },
  { name: 'Caramel Machiatto', slug: 'caramel-macchiato', categorySlug: 'ca-phe', basePrice: 40000 },
  { name: 'Mocha', slug: 'mocha', categorySlug: 'ca-phe', basePrice: 40000 },
  { name: 'Cà Phê Muối', slug: 'ca-phe-muoi', categorySlug: 'ca-phe', basePrice: 40000 },
  { name: 'Choco Latte', slug: 'choco-latte', categorySlug: 'latte', basePrice: 28000 },
  { name: 'Matcha Latte', slug: 'matcha-latte', categorySlug: 'latte', basePrice: 45000 },
  { name: 'Freeze Chocolate', slug: 'freeze-chocolate', categorySlug: 'freeze', basePrice: 40000 },
  { name: 'Freeze Matcha', slug: 'freeze-matcha', categorySlug: 'freeze', basePrice: 28000 },
  { name: 'Trà Cúc Sen Vàng', slug: 'tra-cuc-sen-vang', categorySlug: 'tra', basePrice: 28000 },
  { name: 'Trà Ổi Hồng', slug: 'tra-oi-hong', categorySlug: 'tra', basePrice: 45000 },
  { name: 'Trà Vải', slug: 'tra-vai', categorySlug: 'tra', basePrice: 28000 },
  { name: 'Trà Đào', slug: 'tra-dao', categorySlug: 'tra', basePrice: 45000 },
  { name: 'Trà Xanh Đậu Đỏ', slug: 'tra-xanh-dau-do', categorySlug: 'tra', basePrice: 40000 },
  { name: 'Trà Đào Cam Sả', slug: 'tra-dao-cam-sa', categorySlug: 'tra', basePrice: 40000 },
  { name: 'Trà Olong Sữa Nhài', slug: 'tra-olong-sua-nhai', categorySlug: 'tra-sua', basePrice: 40000 },
  { name: 'Trà Olong Sữa Dừa', slug: 'tra-olong-sua-dua', categorySlug: 'tra-sua', basePrice: 28000 },
  { name: 'Trà Sữa Truyền Thống', slug: 'tra-sua-truyen-thong', categorySlug: 'tra-sua', basePrice: 40000 },
  { name: 'Trà Sữa HongKong', slug: 'tra-sua-hongkong', categorySlug: 'tra-sua', basePrice: 28000 },
  { name: 'Trà Sữa Matcha', slug: 'tra-sua-matcha', categorySlug: 'tra-sua', basePrice: 28000 },
  { name: 'Trà Sữa Đường Đen', slug: 'tra-sua-duong-den', categorySlug: 'tra-sua', basePrice: 45000 },
  { name: 'Soda Việt Quốc', slug: 'soda-viet-quoc', categorySlug: 'soda', basePrice: 40000 },
  { name: 'Soda Dâu', slug: 'soda-dau', categorySlug: 'soda', basePrice: 28000 },
  { name: 'Soda Chanh', slug: 'soda-chanh', categorySlug: 'soda', basePrice: 40000 },
  { name: 'Soda Bạc Hà', slug: 'soda-bac-ha', categorySlug: 'soda', basePrice: 28000 },
  { name: 'Soda Chanh Dây', slug: 'soda-chanh-day', categorySlug: 'soda', basePrice: 45000 },
];

const designProducts: ProductSeed[] = designMenu.map((product) => ({
  ...product,
  description: `${product.name} được pha chế theo công thức BrewLite.`,
  imageUrl: `/products/${product.slug}.png`,
  stock: product.stock ?? 30,
  toppingSlugs: ['tran-chau-trang', 'kem-tuoi'],
}));

async function main() {
  const categoryIds = new Map<string, number>();
  const toppingIds = new Map<string, number>();

  await prisma.product.updateMany({ data: { isAvailable: false } });
  await prisma.category.updateMany({ data: { isActive: false } });

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryIds.set(savedCategory.slug, savedCategory.id);
  }

  for (const topping of toppings) {
    const savedTopping = await prisma.topping.upsert({
      where: { slug: topping.slug },
      update: topping,
      create: topping,
    });
    toppingIds.set(savedTopping.slug, savedTopping.id);
  }

  for (const product of designProducts) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category: ${product.categorySlug}`);
    }

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        categoryId,
        basePrice: product.basePrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
        isAvailable: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId,
        basePrice: product.basePrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
    });

    await prisma.$transaction([
      prisma.productSize.deleteMany({ where: { productId: savedProduct.id } }),
      prisma.productTopping.deleteMany({ where: { productId: savedProduct.id } }),
      prisma.productSize.createMany({
        data: [
          { productId: savedProduct.id, size: SizeCode.S, additionalPrice: 0 },
          { productId: savedProduct.id, size: SizeCode.M, additionalPrice: 7000 },
          { productId: savedProduct.id, size: SizeCode.L, additionalPrice: 12000 },
        ],
      }),
      prisma.productTopping.createMany({
        data: product.toppingSlugs.map((toppingSlug) => {
          const toppingId = toppingIds.get(toppingSlug);

          if (!toppingId) {
            throw new Error(`Missing topping: ${toppingSlug}`);
          }

          return { productId: savedProduct.id, toppingId };
        }),
      }),
    ]);
  }

  console.info(
    `Seeded ${categories.length} categories, ${toppings.length} toppings and ${designProducts.length} products.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
