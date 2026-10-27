"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { ProductDetails, ProductSize, Topping } from "@/lib/catalog";
import {
  AppShell,
  BottomActionBar,
  Button,
  Card,
  CountBadge,
  Icon,
  PageHeader,
  QuantityStepper,
  SectionTitle,
} from "@/components/ui";

const sizeLabels: Record<ProductSize, string> = {
  S: "Size S",
  M: "Size M",
  L: "Size L",
};

const iceOptions = [
  { id: "normal", label: "Bình thường" },
  { id: "less", label: "Ít đá" },
  { id: "none", label: "Không đá" },
] as const;

export type ProductSelection = {
  productId: number;
  productName: string;
  size: ProductSize;
  ice: (typeof iceOptions)[number]["id"];
  toppings: Topping[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export function ProductDetailScreen({
  product,
  toppings,
  itemCount = 0,
  onBack,
  onAddToCart,
}: {
  product: ProductDetails;
  toppings: Topping[];
  itemCount?: number;
  onBack: () => void;
  onAddToCart: (selection: ProductSelection) => void;
}) {
  const [size, setSize] = useState<ProductSize>("M");
  const [ice, setIce] = useState<ProductSelection["ice"]>("normal");
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<Set<number>>(
    () => new Set(),
  );

  const selected = toppings.filter((topping) => selectedToppings.has(topping.id));
  const unitPrice =
    product.sizePrices[size] +
    selected.reduce((total, topping) => total + topping.price, 0);
  const totalPrice = unitPrice * quantity;
  const soldOut = product.stock <= 0 || !product.isAvailable;

  function toggleTopping(id: number) {
    setSelectedToppings((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addToCart() {
    if (soldOut) return;
    onAddToCart({
      productId: product.id,
      productName: product.name,
      size,
      ice,
      toppings: selected,
      quantity,
      unitPrice,
      totalPrice,
    });
  }

  return (
    <AppShell>
      <PageHeader
        action={
          <Link
            aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
            className="relative grid size-10 place-items-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-caramel"
            href="/cart"
          >
            <Icon name="cart" className="size-6" />
            <CountBadge count={itemCount} />
          </Link>
        }
        onBack={onBack}
        title="Chi tiết sản phẩm"
      />

      <Card className="mb-5 flex items-center gap-3 p-3">
        <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
          <Image
            alt={product.name}
            className={`object-cover ${soldOut ? "brightness-50" : ""}`}
            fill
            priority
            sizes="128px"
            src={product.imageUrl}
          />
          {soldOut ? (
            <span className="absolute inset-0 grid place-items-center text-xs font-bold text-white">
              Hết hàng
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-tight text-ink">{product.name}</h2>
          <p className="mt-1 text-lg font-semibold text-caramel">{formatCurrency(unitPrice)}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">Số lượng</span>
            <QuantityStepper
              label={`Số lượng ${product.name}`}
              max={Math.max(product.stock, 1)}
              onChange={setQuantity}
              value={quantity}
            />
          </div>
        </div>
      </Card>

      <section className="mb-4">
        <SectionTitle title="Kích cỡ" />
        <Card className="space-y-0.5 p-3">
          {(["S", "M", "L"] as const).map((option) => (
            <label
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1 ${
                size === option ? "text-ink" : "text-ink"
              }`}
              key={option}
            >
              <span className="text-base font-semibold text-ink">
                {sizeLabels[option]}: {formatCurrency(product.sizePrices[option])}
              </span>
              <input
                aria-label={`${sizeLabels[option]} ${formatCurrency(product.sizePrices[option])}`}
                checked={size === option}
                className="size-5 accent-caramel"
                name="productSize"
                onChange={() => setSize(option)}
                type="radio"
                value={option}
              />
            </label>
          ))}
        </Card>
      </section>

      <section className="mb-4">
        <SectionTitle title="Chọn lượng đá" />
        <div className="grid grid-cols-3 gap-2">
          {iceOptions.map((option) => (
            <button
              aria-pressed={ice === option.id}
              className={`min-h-11 rounded-xl bg-white px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel ${
                ice === option.id
                  ? "ring-2 ring-caramel text-caramel"
                  : "text-ink hover:bg-amber-50"
              }`}
              key={option.id}
              onClick={() => setIce(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <SectionTitle title="Topping" />
        <Card className="divide-y divide-stone-100 p-3">
          {toppings.map((topping) => (
            <label
              className="flex min-h-9 cursor-pointer items-center justify-between gap-3 py-1 text-sm font-medium text-ink"
              key={topping.id}
            >
              <span>
                {topping.name} (+{formatCurrency(topping.price)})
              </span>
              <input
                aria-label={`${topping.name}, thêm ${formatCurrency(topping.price)}`}
                checked={selectedToppings.has(topping.id)}
                className="size-5 shrink-0 accent-caramel"
                disabled={!topping.isAvailable}
                onChange={() => toggleTopping(topping.id)}
                type="checkbox"
              />
            </label>
          ))}
        </Card>
      </section>

      <BottomActionBar>
        <Button disabled={soldOut} fullWidth onClick={addToCart}>
          {soldOut ? "Tạm hết hàng" : `Thêm vào giỏ hàng - ${formatCurrency(totalPrice)}`}
        </Button>
      </BottomActionBar>
    </AppShell>
  );
}
