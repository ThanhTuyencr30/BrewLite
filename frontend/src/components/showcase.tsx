"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductCard, type Product } from "@/components/products";
import {
  AppShell,
  CategoryRail,
  Card,
  EmptyState,
  HomeHeader,
  SectionTitle,
} from "@/components/ui";

const products: (Product & { category: string })[] = [
  {
    id: "1",
    name: "Cà Phê Sữa",
    description: "Cà phê sữa thơm béo, pha mới mỗi ngày",
    price: 28000,
    category: "Cà phê",
    imageUrl: "/product-milk-coffee.jpeg",
  },
  {
    id: "2",
    name: "Americano",
    description: "Espresso cân bằng, hậu vị thanh",
    price: 32000,
    category: "Cà phê",
    imageUrl: "/product-americano.jpeg",
  },
  {
    id: "3",
    name: "Cappuccino",
    description: "Espresso đậm đà, sữa tươi và lớp bọt mịn",
    price: 40000,
    category: "Cà phê",
    imageUrl: "/product-cappuccino.jpeg",
  },
  {
    id: "4",
    name: "Trà đào",
    description: "Trà đào mát lạnh, vị ngọt dịu",
    price: 39000,
    category: "Trà",
    soldOut: true,
    imageUrl: "/product-peach-tea.svg",
  },
];

const categories = ["Tất cả", "Cà phê", "Trà", "Latte", "Freeze", "Soda"];

export function BrewLiteShowcase() {
  const router = useRouter();
  const [category, setCategory] = useState("Tất cả");
  const [message, setMessage] = useState("");
  const visibleProducts = useMemo(
    () => products.filter((product) => category === "Tất cả" || product.category === category),
    [category],
  );

  function openProduct(product: Product) {
    router.push(`/products/${product.id}`);
  }

  return (
    <AppShell>
      <HomeHeader
        itemCount={0}
        onCartClick={() => setMessage("Luồng giỏ hàng sẽ được hoàn thiện trong Gói 3.")}
        onProfileClick={() => setMessage("Khu vực tài khoản sẽ được kết nối sau.")}
      />
      <section className="mb-6 rounded-3xl bg-caramel p-5 text-white">
        <p className="text-sm text-white/75">Mỗi ngày một chút dịu dàng</p>
        <h1 className="mt-1 text-2xl font-bold">Chọn vị bạn yêu</h1>
        <p className="mt-2 text-sm text-white/80">Cà phê tươi, pha cho riêng hôm nay.</p>
      </section>

      <div className="mb-5">
        <CategoryRail
          categories={categories}
          onSelect={setCategory}
          selected={category}
        />
      </div>
      <SectionTitle title="Menu hôm nay" />
      {visibleProducts.length ? (
        <div className="grid grid-cols-2 gap-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} onViewDetails={openProduct} product={product} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            description="Danh mục này chưa có món nào. Hãy chọn danh mục khác nhé."
            title="Chưa có sản phẩm"
          />
        </Card>
      )}

      {message ? (
        <p aria-live="polite" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <Card className="mt-6 flex items-center justify-between gap-3">
        <span className="text-sm text-ink-muted">Khu vực nhân viên</span>
        <Link className="text-sm font-semibold text-caramel underline" href="/barista">
          Quầy pha chế demo
        </Link>
      </Card>
    </AppShell>
  );
}
