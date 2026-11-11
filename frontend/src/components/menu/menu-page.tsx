"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { ConnectionError } from "@/components/common/connection-error";
import { ApiError, getCategories, getMe, getProducts } from "@/lib/api";
import type { Category, Product, User } from "@/lib/api.types";
import { clearAccessToken, getAccessToken } from "@/lib/auth-token";
import { MenuSkeleton } from "./menu-skeleton";
import { ProductCard } from "./product-card";

const SEARCH_DEBOUNCE_MS = 300;

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuPage() {
  const { itemCount } = useCart();
  const [activeCategory, setActiveCategory] = useState("ca-phe");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [accountLoadFailed, setAccountLoadFailed] = useState(false);
  const hasLoadedCategoriesRef = useRef(false);

  useEffect(() => {
    const token = getAccessToken();
    if (token === null) {
      return;
    }

    const controller = new AbortController();
    async function loadAccount(accessToken: string) {
      try {
        setAccountUser(await getMe(accessToken, controller.signal));
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearAccessToken();
          return;
        }

        setAccountLoadFailed(true);
      }
    }

    void loadAccount(token);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      if (hasLoadedCategoriesRef.current) {
        setIsSearching(true);
      } else {
        setIsInitialLoading(true);
      }
      setHasError(false);

      try {
        if (!hasLoadedCategoriesRef.current) {
          const [nextCategories, nextProducts] = await Promise.all([
            getCategories(controller.signal),
            getProducts(
              { search: debouncedSearch, category: "all" },
              controller.signal,
            ),
          ]);

          hasLoadedCategoriesRef.current = true;
          setCategories(nextCategories);
          setProducts(nextProducts);
        } else {
          const nextProducts = await getProducts(
            { search: debouncedSearch, category: "all" },
            controller.signal,
          );
          setProducts(nextProducts);
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setHasError(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false);
          setIsSearching(false);
        }
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, [debouncedSearch, retryCount]);

  function handleClearSearch() {
    setSearchInput("");
    setDebouncedSearch("");
  }

  const visibleCategories =
    debouncedSearch.length > 0
      ? categories.filter((category) =>
          products.some((product) => product.category.slug === category.slug),
        )
      : categories;

  if (isInitialLoading) {
    return <MenuSkeleton />;
  }

  if (hasError) {
    return (
      <ConnectionError
        onRetry={() => setRetryCount((count) => count + 1)}
        onHome={() => {
          handleClearSearch();
          setActiveCategory("ca-phe");
        }}
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
          <Link
            aria-label={
              accountUser
                ? `Tài khoản của ${accountUser.fullName || accountUser.email}`
                : accountLoadFailed
                  ? "Không tải được tài khoản. Chạm để thử lại."
                  : "Đăng nhập tài khoản"
            }
            className="account-button"
            href={accountUser || accountLoadFailed ? "/profile" : "/login"}
          >
            <AccountIcon />
          </Link>
          <Link
            aria-label={`Giỏ hàng có ${itemCount} món`}
            className="cart-button"
            href="/cart"
          >
            <CartIcon />
            {itemCount > 0 && <span>{itemCount > 99 ? "99+" : itemCount}</span>}
          </Link>
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

        <div className="figma-search" role="search">
          <label className="sr-only" htmlFor="menu-search-input">
            Tìm kiếm món trong thực đơn
          </label>
          <span className="figma-search__icon">
            <SearchIcon />
          </span>
          <input
            id="menu-search-input"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && searchInput) {
                event.preventDefault();
                handleClearSearch();
              }
            }}
            placeholder="Tìm món (VD: Trà đào, Latte...)"
            autoComplete="off"
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              className="figma-search__clear"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={handleClearSearch}
            >
              <ClearIcon />
            </button>
          )}
        </div>

        {(isSearching || debouncedSearch.length > 0) && (
          <p className="figma-search-status" aria-live="polite">
            {isSearching
              ? "Đang tìm món..."
              : `Tìm thấy ${products.length} món cho "${debouncedSearch}"`}
          </p>
        )}

        <div className="figma-menu__body">
          {!hasError && visibleCategories.length > 0 && (
            <nav className="vertical-categories" aria-label="Đi đến danh mục">
              {visibleCategories.map((category) => (
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
                <div className="figma-empty-state__icon">
                  <SearchIcon />
                </div>
                <h2>
                  {debouncedSearch.length > 0
                    ? "Không tìm thấy món phù hợp"
                    : "Menu đang được cập nhật"}
                </h2>
                <p>
                  {debouncedSearch.length > 0
                    ? `Không có món nào khớp với "${debouncedSearch}". Hãy thử từ khóa khác nhé.`
                    : "Quay lại sau một chút để khám phá các món mới."}
                </p>
                {debouncedSearch.length > 0 && (
                  <button type="button" onClick={handleClearSearch}>
                    Xóa tìm kiếm
                  </button>
                )}
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
