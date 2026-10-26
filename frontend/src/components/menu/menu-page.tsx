"use client";

import { useEffect, useState } from "react";
import { ConnectionError } from "@/components/common/connection-error";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/api.types";
import { MenuSkeleton } from "./menu-skeleton";
import { ProductCard } from "./product-card";

const SEARCH_DELAY_MS = 350;

export function MenuPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DELAY_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      setIsLoading(true);
      setHasError(false);

      try {
        const [nextCategories, nextProducts] = await Promise.all([
          getCategories(controller.signal),
          getProducts(
            { search, category: selectedCategory },
            controller.signal,
          ),
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
  }, [retryCount, search, selectedCategory]);

  const hasFilters = search.length > 0 || selectedCategory !== "all";

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BrewLite - về đầu trang">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path d="M11 12h18v10a9 9 0 0 1-9 9 9 9 0 0 1-9-9V12Z" />
              <path d="M29 15h2a5 5 0 0 1 0 10h-3M15 7c0 2 2 2 2 4M22 7c0 2 2 2 2 4" />
            </svg>
          </span>
          <span>BrewLite</span>
        </a>
        <nav aria-label="Điều hướng chính">
          <a className="nav-link nav-link--active" href="#menu">
            Thực đơn
          </a>
          <a className="nav-link" href="#about">
            Về BrewLite
          </a>
        </nav>
        <span className="header-note">Mở cửa 07:00–22:00</span>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__content">
            <p className="eyebrow">Cà phê ngon, ngày nhẹ tênh</p>
            <h1 id="hero-title">
              Một ngụm <em>thảnh thơi</em>,<br /> một ngày đầy cảm hứng.
            </h1>
            <p className="hero__description">
              Chọn món bạn thích, BrewLite chuẩn bị thật nhanh. Không xếp hàng,
              không cần tiền mặt.
            </p>
            <a className="primary-button" href="#menu">
              Khám phá thực đơn
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <span className="hero__sun" />
            <div className="hero__cup">
              <span className="hero__steam hero__steam--one" />
              <span className="hero__steam hero__steam--two" />
              <span className="hero__coffee" />
              <span className="hero__handle" />
            </div>
            <div className="hero__badge">
              <strong>30+</strong>
              <span>món để chọn</span>
            </div>
          </div>
        </section>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="menu-heading">
            <div>
              <p className="eyebrow">Chọn món hôm nay</p>
              <h2 id="menu-title">Thực đơn BrewLite</h2>
            </div>
            <label className="search-box">
              <span className="sr-only">Tìm kiếm món</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Bạn muốn uống gì?"
              />
            </label>
          </div>

          {!hasError && categories.length > 0 && (
            <div className="category-list" aria-label="Lọc theo danh mục">
              <button
                className={selectedCategory === "all" ? "is-active" : ""}
                type="button"
                onClick={() => setSelectedCategory("all")}
              >
                Tất cả
              </button>
              {categories.map((category) => (
                <button
                  className={
                    selectedCategory === category.slug ? "is-active" : ""
                  }
                  type="button"
                  onClick={() => setSelectedCategory(category.slug)}
                  key={category.id}
                >
                  {category.name}
                  <span>{category.productCount}</span>
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <MenuSkeleton />
          ) : hasError ? (
            <ConnectionError onRetry={() => setRetryCount((count) => count + 1)} />
          ) : products.length === 0 ? (
            <section className="empty-state" aria-live="polite">
              <span className="empty-state__icon" aria-hidden="true">☕</span>
              <h3>{hasFilters ? "Không tìm thấy món phù hợp" : "Menu đang được cập nhật"}</h3>
              <p>
                {hasFilters
                  ? "Thử một từ khóa khác hoặc chọn lại danh mục nhé."
                  : "Quay lại sau một chút để khám phá các món mới."}
              </p>
              {hasFilters && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </section>
          ) : (
            <div className="menu-content" aria-live="polite">
              <p className="result-count">
                <strong>{products.length}</strong> món đang chờ bạn
              </p>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="about-strip" id="about">
          <p>Đặt trước · Thanh toán gọn · Nhận món nhanh</p>
          <strong>BrewLite — nhẹ nhàng trong từng lựa chọn.</strong>
        </section>
      </main>

      <footer>
        <a className="brand brand--footer" href="#top">BrewLite</a>
        <p>© 2026 BrewLite. Được pha bằng sự tử tế.</p>
      </footer>
    </div>
  );
}
