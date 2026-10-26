"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  AddToCartButton,
  ProductCard,
  type Product,
} from "@/components/products";
import {
  AppShell,
  BottomActionBar,
  CategoryRail,
  Card,
  EmptyState,
  HomeHeader,
  QuantityStepper,
  SectionTitle,
} from "@/components/ui";

const products: (Product & { category: string })[] = [
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso đậm đà, sữa tươi và lớp bọt mịn",
    price: 39000,
    category: "Cà phê",
  },
  {
    id: "latte",
    name: "Latte caramel",
    description: "Vị caramel dịu ngọt hòa cùng espresso",
    price: 45000,
    category: "Latte",
  },
  {
    id: "matcha",
    name: "Matcha latte",
    description: "Trà xanh Nhật Bản kết hợp sữa tươi",
    price: 49000,
    category: "Latte",
  },
  {
    id: "cold-brew",
    name: "Cold brew",
    description: "Ủ lạnh 18 giờ, hậu vị thanh mát",
    price: 42000,
    category: "Cà phê",
    soldOut: true,
  },
];

const categories = ["Tất cả", "Cà phê", "Latte", "Freeze", "Trà", "Soda"];

export function BrewLiteShowcase() {
  const [category, setCategory] = useState("Tất cả");
  const [selected, setSelected] = useState<(typeof products)[number] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [message, setMessage] = useState("");
  const visibleProducts = useMemo(
    () => products.filter((product) => category === "Tất cả" || product.category === category),
    [category],
  );

  function openProduct(product: Product) {
    const fullProduct = products.find((item) => item.id === product.id);
    if (!fullProduct) return;
    setSelected(fullProduct);
    setQuantity(1);
    setMessage("");
  }

  function addToCart() {
    if (!selected) return;
    setCartCount((count) => count + quantity);
    setMessage(`${selected.name} đã được thêm vào giỏ hàng.`);
    setSelected(null);
  }

  return (
    <AppShell>
      <HomeHeader
        itemCount={cartCount}
        onCartClick={() => document.getElementById("cart-summary")?.scrollIntoView({ behavior: "smooth" })}
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

      {selected ? (
        <Card className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-caramel">Tùy chỉnh món</p>
          <h2 className="mt-1 text-lg font-bold text-ink">{selected.name}</h2>
          <p className="mt-1 text-sm text-ink-muted">{formatCurrency(selected.price)}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-ink">Số lượng</span>
            <QuantityStepper onChange={setQuantity} value={quantity} />
          </div>
          <div className="mt-4">
            <AddToCartButton
              onAdd={addToCart}
              soldOut={selected.soldOut}
              total={selected.price * quantity}
            />
          </div>
        </Card>
      ) : null}

      <div className="mt-6" id="cart-summary">
        <Card className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Giỏ hàng</span>
          <span className="text-sm text-ink-muted">{cartCount} sản phẩm</span>
        </Card>
      </div>

      {cartCount > 0 ? (
        <BottomActionBar>
          <button
            className="w-full text-center text-sm font-semibold text-caramel"
            onClick={() => setMessage("Giỏ hàng đã sẵn sàng để tiếp tục đặt món.")}
            type="button"
          >
            Xem giỏ hàng · {cartCount} sản phẩm
          </button>
        </BottomActionBar>
      ) : null}
    </AppShell>
  );
}
