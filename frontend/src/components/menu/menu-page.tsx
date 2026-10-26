"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ConnectionError } from "@/components/common/connection-error";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/api.types";
import { MenuSkeleton } from "./menu-skeleton";
import { ProductCard } from "./product-card";

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="4" />
      <path d="M4.5 21c.6-5 3-7.5 7.5-7.5s6.9 2.5 7.5 7.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 28 24" aria-hidden="true">
      <path d="M2 2h3l2.2 12.2h14.4l2.2-8.7H6" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="21" cy="20" r="1.5" />
    </svg>
  );
}

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("ca-phe");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [nextCategories, nextProducts] = await Promise.all([
          getCategories(controller.signal),
          getProducts({ search: "", category: "all" }, controller.signal),
        ]);

        setCategories(nextCategories);
        setProducts(nextProducts);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setHasError(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, [retryCount]);

  if (isLoading) {
    return <MenuSkeleton />;
  }

  if (hasError) {
    return (
      <ConnectionError
        onRetry={() => setRetryCount((count) => count + 1)}
        onHome={() => setActiveCategory("ca-phe")}
      />
    );
  }

  return (
    <main className="coffee-app">
      <header className="coffee-header">
        <div>
          <a className="coffee-brand" href="#menu" aria-label="BrewLite - về đầu trang">
            BREWLITE
          </a>
          <p>Cà phê ngon, bắt đầu ngày mới</p>
        </div>

        <div className="coffee-header__actions">
          <button type="button" aria-label="Tài khoản">
            <AccountIcon />
          </button>
          <button className="cart-button" type="button" aria-label="Giỏ hàng có 4 món">
            <CartIcon />
            <span>4</span>
          </button>
        </div>
      </header>

      <section className="figma-menu" id="menu" aria-labelledby="menu-title">
          <Image
            className="coffee-mark"
            src="/products/coffee-mark.png"
            alt=""
            width={78}
            height={72}
            priority
          />
          <h1 id="menu-title">Menu hôm nay</h1>

          <div className="figma-menu__body">
            {!hasError && categories.length > 0 && (
              <nav className="vertical-categories" aria-label="Đi đến danh mục">
                {categories.map((category) => (
                  <button
                    className={activeCategory === category.slug ? "is-active" : ""}
                    type="button"
                    aria-current={activeCategory === category.slug ? "true" : undefined}
                    onClick={() => {
                      setActiveCategory(category.slug);
                      document
                        .getElementById(`category-${category.slug}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    key={category.id}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            )}

            <div className="figma-menu__content">
              {products.length === 0 ? (
                <section className="figma-empty-state" aria-live="polite">
                  <h2>Menu đang được cập nhật</h2>
                  <p>Quay lại sau một chút để khám phá các món mới.</p>
                </section>
              ) : (
                <div className="category-sections" aria-live="polite">
                  {categories.map((category) => {
                    const categoryProducts = products.filter(
                      (product) => product.category.slug === category.slug,
                    );

                    if (categoryProducts.length === 0) {
                      return null;
                    }

                    return (
                      <section
                        className="category-section"
                        id={`category-${category.slug}`}
                        aria-labelledby={`category-title-${category.slug}`}
                        key={category.id}
                      >
                        <h2 className="sr-only" id={`category-title-${category.slug}`}>
                          {category.name}
                        </h2>
                        <div className="product-grid">
                          {categoryProducts.map((product) => (
                            <ProductCard product={product} key={product.id} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
      </section>
    </main>
  );
}
