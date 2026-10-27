"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import {
  Button,
  Card,
  Checkbox,
  QuantityStepper,
  Radio,
  SectionTitle,
  Skeleton,
} from "@/components/ui";

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: ReactNode;
  imageUrl?: string;
  soldOut?: boolean;
};

export function ProductCard({
  product,
  onViewDetails,
}: {
  product: Product;
  onViewDetails?: (product: Product) => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-gradient-to-br from-amber-100 to-orange-50">
        {product.imageUrl ? (
          <Image
            alt={product.name}
            className="object-cover"
            fill
            sizes="(max-width: 430px) 45vw, 200px"
            src={product.imageUrl}
          />
        ) : product.image ? (
          product.image
        ) : (
          <span aria-label={product.name} className="text-6xl" role="img">
            ☕
          </span>
        )}
        {product.soldOut ? (
          <div className="absolute inset-0 grid place-items-center bg-white/75 text-sm font-bold text-red-700">
            Hết hàng
          </div>
        ) : null}
      </div>
      <div className="p-3.5">
        <h3 className="truncate font-semibold text-ink">{product.name}</h3>
        {product.description ? (
          <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-4 text-ink-muted">
            {product.description}
          </p>
        ) : null}
        <p className="mt-2 font-bold text-caramel">{formatCurrency(product.price)}</p>
        <Button
          className="mt-3 min-h-10 px-3 text-xs"
          fullWidth
          onClick={() => onViewDetails?.(product)}
          variant="secondary"
        >
          Xem chi tiết
        </Button>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  onViewDetails,
}: {
  products: Product[];
  onViewDetails?: (product: Product) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => (
        <ProductCard key={product.id} onViewDetails={onViewDetails} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-label="Đang tải sản phẩm" className="grid grid-cols-2 gap-3" role="status">
      {Array.from({ length: count }, (_, index) => (
        <Card className="p-3.5" key={index}>
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function ProductSummary({
  product,
  quantity,
  onQuantityChange,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-amber-100 text-3xl">
        {product.imageUrl ? (
          <Image
            alt={product.name}
            className="size-20 rounded-2xl object-cover"
            height={80}
            sizes="80px"
            src={product.imageUrl}
            width={80}
          />
        ) : (
          product.image ?? "☕"
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-bold text-ink">{product.name}</h2>
        <p className="mt-1 font-semibold text-caramel">{formatCurrency(product.price)}</p>
      </div>
      <QuantityStepper onChange={onQuantityChange} value={quantity} />
    </div>
  );
}

export function OptionGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-stone-100 py-5 last:border-0">
      <SectionTitle title={title} />
      {description ? <p className="-mt-2 mb-3 text-xs text-ink-muted">{description}</p> : null}
      {children}
    </section>
  );
}

export function SizeSelector({
  name = "size",
  value,
  sizes,
  onChange,
}: {
  name?: string;
  value: string;
  sizes: { value: string; label: string; price: number }[];
  onChange: (size: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {sizes.map((size) => (
        <label
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border p-3 text-center ${value === size.value ? "border-caramel bg-amber-50" : "border-stone-200"}`}
          key={size.value}
        >
          <input
            checked={value === size.value}
            className="sr-only"
            name={name}
            onChange={() => onChange(size.value)}
            type="radio"
            value={size.value}
          />
          <span className="font-bold text-ink">{size.label}</span>
          <span className="text-xs text-ink-muted">{formatCurrency(size.price)}</span>
        </label>
      ))}
    </div>
  );
}

export function IceSelector({
  value,
  onChange,
}: {
  value: "normal" | "less" | "none";
  onChange: (value: "normal" | "less" | "none") => void;
}) {
  const choices = [
    { value: "normal" as const, label: "Bình thường" },
    { value: "less" as const, label: "Ít đá" },
    { value: "none" as const, label: "Không đá" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => (
        <button
          aria-pressed={value === choice.value}
          className={`rounded-full border px-3 py-2 text-sm ${value === choice.value ? "border-caramel bg-amber-50 text-caramel" : "border-stone-200 text-ink-muted"}`}
          key={choice.value}
          onClick={() => onChange(choice.value)}
          type="button"
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

export function ToppingList({
  toppings,
  selectedIds,
  onToggle,
}: {
  toppings: { id: string; name: string; price: number }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      {toppings.map((topping) => (
        <Checkbox
          checked={selectedIds.includes(topping.id)}
          key={topping.id}
          label={topping.name}
          onChange={() => onToggle(topping.id)}
          priceLabel={`+${formatCurrency(topping.price)}`}
        />
      ))}
    </div>
  );
}

export function AddToCartButton({
  total,
  soldOut = false,
  onAdd,
}: {
  total: number;
  soldOut?: boolean;
  onAdd: () => void;
}) {
  return (
    <Button disabled={soldOut} fullWidth onClick={onAdd}>
      {soldOut ? "Tạm hết hàng" : `Thêm vào giỏ hàng · ${formatCurrency(total)}`}
    </Button>
  );
}

export function ProductOptionsCard({ children }: { children: ReactNode }) {
  return <Card className="divide-y divide-stone-100">{children}</Card>;
}

export function SizeRadio({
  name,
  value,
  label,
  price,
}: {
  name: string;
  value: string;
  label: string;
  price: string;
}) {
  return <Radio name={name} value={value} label={label} priceLabel={price} />;
}
