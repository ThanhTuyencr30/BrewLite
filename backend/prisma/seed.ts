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
  { name: 'Trân châu đen', slug: 'tran-chau-den', price: 5000, stock: 120 },
  { name: 'Trân châu trắng', slug: 'tran-chau-trang', price: 5000, stock: 100 },
  { name: 'Trân châu hoàng kim', slug: 'tran-chau-hoang-kim', price: 5000, stock: 90 },
  { name: 'Thạch củ năng', slug: 'thach-cu-nang', price: 5000, stock: 80 },
  { name: 'Thạch phô mai', slug: 'thach-pho-mai', price: 5000, stock: 90 },
  { name: 'Thạch rau câu', slug: 'thach-rau-cau', price: 5000, stock: 90 },
  { name: 'Flan', slug: 'flan', price: 5000, stock: 75 },
  { name: 'Pudding', slug: 'pudding', price: 5000, stock: 75 },
  { name: 'Kem cheese', slug: 'kem-cheese', price: 5000, stock: 70 },
] as const;

// Tồn kho tính theo đơn vị nhỏ nhất: g, ml.
const ingredients = [
  { name: 'Cà phê hạt', unit: 'g', stock: 5000 },
  { name: 'Sữa tươi', unit: 'ml', stock: 20000 },
  { name: 'Sữa đặc', unit: 'ml', stock: 8000 },
  { name: 'Kem sữa', unit: 'ml', stock: 5000 },
  { name: 'Đường', unit: 'g', stock: 10000 },
  { name: 'Muối', unit: 'g', stock: 1000 },
  { name: 'Bột cacao', unit: 'g', stock: 3000 },
  { name: 'Bột matcha', unit: 'g', stock: 2000 },
  { name: 'Trà đen', unit: 'g', stock: 3000 },
  { name: 'Trà olong', unit: 'g', stock: 2000 },
  { name: 'Trà xanh', unit: 'g', stock: 1500 },
  { name: 'Trà hoa cúc', unit: 'g', stock: 1000 },
  { name: 'Syrup caramel', unit: 'ml', stock: 2000 },
  { name: 'Syrup đào', unit: 'ml', stock: 3000 },
  { name: 'Syrup vải', unit: 'ml', stock: 2000 },
  { name: 'Syrup ổi', unit: 'ml', stock: 2000 },
  { name: 'Syrup đường đen', unit: 'ml', stock: 2000 },
  { name: 'Syrup việt quốc', unit: 'ml', stock: 2000 },
  { name: 'Nước cốt dừa', unit: 'ml', stock: 4000 },
  { name: 'Soda', unit: 'ml', stock: 15000 },
  { name: 'Nước cốt chanh', unit: 'ml', stock: 2000 },
  { name: 'Chanh dây', unit: 'g', stock: 2000 },
  { name: 'Dâu', unit: 'g', stock: 3000 },
  { name: 'Bạc hà', unit: 'g', stock: 1000 },
  { name: 'Sả', unit: 'g', stock: 1000 },
  { name: 'Đậu đỏ', unit: 'g', stock: 3000 },
  { name: 'Đào miếng', unit: 'g', stock: 3000 },
] as const;

// Định lượng cho size S; size M và L nhân theo hệ số bên dưới.
const SIZE_FACTORS: Record<SizeCode, number> = { S: 1, M: 1.25, L: 1.5 };

const baseRecipes: Record<string, Record<string, number>> = {
  'ca-phe-sua': { 'Cà phê hạt': 18, 'Sữa đặc': 25, 'Sữa tươi': 50 },
  cappuccino: { 'Cà phê hạt': 18, 'Sữa tươi': 110, 'Đường': 5 },
  americano: { 'Cà phê hạt': 18, 'Đường': 5 },
  'caramel-macchiato': { 'Cà phê hạt': 18, 'Sữa tươi': 90, 'Syrup caramel': 20 },
  mocha: { 'Cà phê hạt': 18, 'Sữa tươi': 80, 'Bột cacao': 12, 'Đường': 5 },
  'ca-phe-muoi': { 'Cà phê hạt': 18, 'Sữa tươi': 70, 'Kem sữa': 25, 'Muối': 2 },
  'choco-latte': { 'Sữa tươi': 110, 'Bột cacao': 15, 'Đường': 8 },
  'matcha-latte': { 'Sữa tươi': 110, 'Bột matcha': 10, 'Đường': 8 },
  'freeze-chocolate': { 'Sữa tươi': 90, 'Bột cacao': 15, 'Đường': 8 },
  'freeze-matcha': { 'Sữa tươi': 90, 'Bột matcha': 10, 'Đường': 8 },
  'tra-cuc-sen-vang': { 'Trà hoa cúc': 6, 'Đường': 8 },
  'tra-oi-hong': { 'Trà đen': 6, 'Syrup ổi': 30, 'Đường': 5 },
  'tra-vai': { 'Trà đen': 6, 'Syrup vải': 30, 'Đường': 5 },
  'tra-dao': { 'Trà đen': 6, 'Syrup đào': 30, 'Đào miếng': 20 },
  'tra-xanh-dau-do': { 'Trà xanh': 6, 'Đậu đỏ': 30, 'Đường': 8 },
  'tra-dao-cam-sa': { 'Trà đen': 6, 'Syrup đào': 25, 'Sả': 5 },
  'tra-olong-sua-nhai': { 'Trà olong': 7, 'Sữa tươi': 70, 'Sữa đặc': 15, 'Đường': 5 },
  'tra-olong-sua-dua': { 'Trà olong': 7, 'Nước cốt dừa': 60, 'Sữa tươi': 30, 'Đường': 5 },
  'tra-sua-truyen-thong': { 'Trà đen': 7, 'Sữa tươi': 70, 'Sữa đặc': 15, 'Đường': 5 },
  'tra-sua-hongkong': { 'Trà đen': 7, 'Sữa tươi': 80, 'Sữa đặc': 20 },
  'tra-sua-matcha': { 'Trà xanh': 6, 'Bột matcha': 8, 'Sữa tươi': 80, 'Đường': 8 },
  'tra-sua-duong-den': { 'Trà đen': 7, 'Sữa tươi': 70, 'Syrup đường đen': 20 },
  'soda-viet-quoc': { 'Soda': 120, 'Syrup việt quốc': 30, 'Đường': 5 },
  'soda-dau': { 'Soda': 120, 'Dâu': 40, 'Đường': 8 },
  'soda-chanh': { 'Soda': 120, 'Nước cốt chanh': 20, 'Đường': 10 },
  'soda-bac-ha': { 'Soda': 120, 'Bạc hà': 5, 'Đường': 8 },
  'soda-chanh-day': { 'Soda': 120, 'Nước cốt chanh': 15, 'Chanh dây': 20, 'Đường': 5 },
};


type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  categorySlug: (typeof categories)[number]['slug'];
  basePrice: number;
  sizePrices?: Record<SizeCode, number>;
  imageUrl: string;
  stock: number;
  toppingSlugs: string[];
};

const designMenu: Array<{
  name: string;
  slug: string;
  categorySlug: (typeof categories)[number]['slug'];
  basePrice: number;
  sizePrices?: Record<SizeCode, number>;
  stock?: number;
}> = [
  {
    name: 'Cà Phê Sữa',
    slug: 'ca-phe-sua',
    categorySlug: 'ca-phe',
    basePrice: 22000,
    sizePrices: { S: 22000, M: 28000, L: 36000 },
    stock: 0,
  },
  {
    name: 'Cappuccino',
    slug: 'cappuccino',
    categorySlug: 'ca-phe',
    basePrice: 34000,
    sizePrices: { S: 34000, M: 40000, L: 48000 },
  },
  {
    name: 'Americano',
    slug: 'americano',
    categorySlug: 'ca-phe',
    basePrice: 26000,
    sizePrices: { S: 26000, M: 32000, L: 40000 },
  },
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
  {
    name: 'Trà Đào',
    slug: 'tra-dao',
    categorySlug: 'tra',
    basePrice: 33000,
    sizePrices: { S: 33000, M: 39000, L: 47000 },
  },
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
  toppingSlugs: toppings.map((topping) => topping.slug),
}));

async function main() {
  const promotions = [
    {
      code: 'GIAM15',
      description: 'Giảm 15% cho đơn từ 50.000đ',
      discountType: 'PERCENT' as const,
      value: 15,
      minOrderValue: 50000,
      maxDiscount: 30000,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.999Z'),
    },
    {
      code: 'GIAM20',
      description: 'Giảm 20.000đ cho đơn từ 120.000đ',
      discountType: 'FIXED_AMOUNT' as const,
      value: 20000,
      minOrderValue: 120000,
      maxDiscount: null,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.999Z'),
    },
    {
      code: 'GIAM10K',
      description: 'Giảm 10.000đ cho đơn từ 60.000đ',
      discountType: 'FIXED_AMOUNT' as const,
      value: 10000,
      minOrderValue: 60000,
      maxDiscount: null,
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-30T23:59:59.999Z'),
    },
  ];

  const categoryIds = new Map<string, number>();
  const toppingIds = new Map<string, number>();
  const ingredientIds = new Map<string, number>();

  await prisma.product.updateMany({ data: { isAvailable: false } });
  await prisma.category.updateMany({ data: { isActive: false } });
  await prisma.topping.updateMany({ data: { isAvailable: false } });

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
      update: { ...topping, isAvailable: true },
      create: topping,
    });
    toppingIds.set(savedTopping.slug, savedTopping.id);
  }

  for (const ingredient of ingredients) {
    const savedIngredient = await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      // Không ghi đè stock khi seed lại để không làm mất tồn kho thực tế.
      update: { unit: ingredient.unit },
      create: ingredient,
    });
    ingredientIds.set(savedIngredient.name, savedIngredient.id);
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

    const baseRecipe = baseRecipes[product.slug];
    if (!baseRecipe) {
      throw new Error(`Missing ingredient recipe for product: ${product.slug}`);
    }

    const recipeRows = Object.values(SizeCode).flatMap((size) =>
      Object.entries(baseRecipe).map(([ingredientName, baseQuantity]) => {
        const ingredientId = ingredientIds.get(ingredientName);
        if (!ingredientId) {
          throw new Error(`Missing ingredient: ${ingredientName}`);
        }

        return {
          productId: savedProduct.id,
          size,
          ingredientId,
          quantity: Math.round(baseQuantity * SIZE_FACTORS[size]),
        };
      }),
    );

    await prisma.$transaction([
      prisma.productSize.deleteMany({ where: { productId: savedProduct.id } }),
      prisma.productTopping.deleteMany({ where: { productId: savedProduct.id } }),
      prisma.productIngredient.deleteMany({ where: { productId: savedProduct.id } }),
      prisma.productSize.createMany({
        data: Object.values(SizeCode).map((size) => ({
          productId: savedProduct.id,
          size,
          additionalPrice:
            (product.sizePrices ?? {
              S: product.basePrice,
              M: product.basePrice + 7000,
              L: product.basePrice + 12000,
            })[size] - product.basePrice,
        })),
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
      prisma.productIngredient.createMany({ data: recipeRows }),
    ]);
  }

  for (const promotion of promotions) {
    await prisma.promotion.upsert({
      where: { code: promotion.code },
      update: {
        ...promotion,
        isActive: true,
      },
      create: {
        ...promotion,
        isActive: true,
      },
    });
  }

  console.info(
    `Seeded ${categories.length} categories, ${toppings.length} toppings, ${ingredients.length} ingredients, ${designProducts.length} products and ${promotions.length} promotions.`,
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
