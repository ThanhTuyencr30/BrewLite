import { BadRequestException } from '@nestjs/common';
import type { Prisma, SizeCode } from '../generated/prisma/client';

export interface StockedOrderItem {
  productId: number;
  productName: string;
  size: SizeCode;
  quantity: number;
}

type RecipeRow = { productId: number; size: SizeCode; ingredientId: number; quantity: number };

function findRecipes(
  tx: Prisma.TransactionClient,
  items: StockedOrderItem[],
): Promise<RecipeRow[]> {
  return tx.productIngredient.findMany({
    where: { OR: items.map(({ productId, size }) => ({ productId, size })) },
    select: { productId: true, size: true, ingredientId: true, quantity: true },
  });
}

// Trừ kho nguyên liệu theo đúng công thức của món + size. Điều kiện stock >=
// lượng cần dùng nằm trong updateMany nên hai đơn đồng thời không thể cùng trừ
// vượt tồn kho.
export async function deductIngredients(
  tx: Prisma.TransactionClient,
  items: StockedOrderItem[],
): Promise<void> {
  if (items.length === 0) return;

  const recipes = await findRecipes(tx, items);
  const required = new Map<number, number>();
  const names = new Map<number, string>();

  for (const item of items) {
    const itemRecipes = recipes.filter(
      (recipe) => recipe.productId === item.productId && recipe.size === item.size,
    );
    if (itemRecipes.length === 0) {
      throw new BadRequestException(
        `Chưa có công thức nguyên liệu cho "${item.productName}" size ${item.size}.`,
      );
    }

    for (const recipe of itemRecipes) {
      required.set(
        recipe.ingredientId,
        (required.get(recipe.ingredientId) ?? 0) + recipe.quantity * item.quantity,
      );
    }
  }

  const ingredients = await tx.ingredient.findMany({
    where: { id: { in: [...required.keys()] } },
    select: { id: true, name: true },
  });
  for (const ingredient of ingredients) names.set(ingredient.id, ingredient.name);

  for (const [ingredientId, quantity] of required) {
    const updated = await tx.ingredient.updateMany({
      where: { id: ingredientId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (updated.count === 0) {
      const name = names.get(ingredientId) ?? `#${ingredientId}`;
      throw new BadRequestException(`Nguyên liệu "${name}" không đủ tồn kho.`);
    }
  }
}

// Hoàn lại nguyên liệu khi đơn bị hủy, đối xứng với lúc trừ kho.
export async function restoreIngredients(
  tx: Prisma.TransactionClient,
  items: StockedOrderItem[],
): Promise<void> {
  if (items.length === 0) return;

  const recipes = await findRecipes(tx, items);
  const restored = new Map<number, number>();

  for (const item of items) {
    for (const recipe of recipes) {
      if (recipe.productId !== item.productId || recipe.size !== item.size) continue;
      restored.set(
        recipe.ingredientId,
        (restored.get(recipe.ingredientId) ?? 0) + recipe.quantity * item.quantity,
      );
    }
  }

  for (const [ingredientId, quantity] of restored) {
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stock: { increment: quantity } },
    });
  }
}
