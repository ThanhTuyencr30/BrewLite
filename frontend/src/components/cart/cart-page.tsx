"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/format";
import { ApiError, createOrder, validateCart, validatePromotion } from "@/lib/api";
import { clearAccessToken, getAccessToken, loginUrl } from "@/lib/auth-token";
import type { CartValidationResult } from "@/lib/api.types";

type Confirmation =
  | { kind: "remove"; id: string; name: string }
  | { kind: "clear" };

export function CartPage() {
  const router = useRouter();
  const {
    items,
    itemCount,
    appliedPromotion,
    setAppliedPromotion,
    setQuantity,
    updateItem,
    removeItem,
    clearCart,
  } = useCart();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [validation, setValidation] = useState<CartValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const cartItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        expectedUnitPrice: item.unitPrice,
      })),
    [items],
  );
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.unitPrice +
            item.toppings.reduce((toppingSum, topping) => toppingSum + topping.price, 0)) *
            item.quantity,
        0,
      ),
    [items],
  );
  const discount = appliedPromotion?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const appliedCode = appliedPromotion?.promotion.code;

  useEffect(() => {
    if (!appliedCode || cartItems.length === 0) {
      return;
    }

    let isCurrent = true;
    void validatePromotion(appliedCode, cartItems)
      .then((result) => {
        if (isCurrent) {
          setAppliedPromotion(result);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setAppliedPromotion(null);
          setCheckoutError("Mã giảm giá không còn hợp lệ cho giỏ hàng hiện tại.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [appliedCode, cartItems, setAppliedPromotion]);

  async function placeOrder() {
    setIsChecking(true);
    setCheckoutError("");
    setValidation(null);
    try {
      const result = await validateCart(cartItems);
      if (!result.valid) {
        setValidation(result);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setShowLogin(true);
        return;
      }

      const order = await createOrder(
        {
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            iceLevel: item.iceLevel,
            quantity: item.quantity,
            toppingIds: item.toppings.map((topping) => topping.id),
          })),
          discountCode: appliedPromotion?.promotion.code,
        },
        token,
      );
      clearCart();
      setAppliedPromotion(null);
      router.push(`/checkout/${order.id}`);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        setShowLogin(true);
        return;
      }
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Không thể kiểm tra số lượng và giá món.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  function confirmRemoval() {
    if (!confirmation) {
      return;
    }

    if (confirmation.kind === "clear") {
      clearCart();
    } else {
      removeItem(confirmation.id);
    }
    setAppliedPromotion(null);
    setConfirmation(null);
    setCheckoutError("");
  }

  function updateCartFromValidation() {
    if (!validation) {
      return;
    }

    const stockByProductId = new Map<number, number>();
    for (const issue of validation.issues) {
      if (issue.reason === "OUT_OF_STOCK" || issue.reason === "UNAVAILABLE") {
        stockByProductId.set(issue.productId, issue.availableStock);
      }
    }

    const remainingStock = new Map(stockByProductId);
    items.forEach((item, index) => {
      const cartResult = validation.items[index];
      const availableStock = remainingStock.get(item.productId);
      if (availableStock === 0) {
        removeItem(item.id);
        return;
      }
      const quantity =
        availableStock === undefined
          ? item.quantity
          : Math.min(item.quantity, availableStock);
      if (availableStock !== undefined) {
        remainingStock.set(item.productId, availableStock - quantity);
      }
      updateItem(item.id, quantity, cartResult.currentUnitPrice);
    });
    setAppliedPromotion(null);
    setValidation(null);
  }

  return (
    <main className="cart-page">
      <header className="cart-screen-header">
        <Link aria-label="Quay lại menu" className="cart-screen-back" href="/#menu">
          <BackIcon />
        </Link>
        <h1>Giỏ hàng</h1>
        <button
          aria-label="Xóa toàn bộ giỏ hàng"
          className="cart-screen-clear"
          onClick={() => items.length > 0 && setConfirmation({ kind: "clear" })}
          type="button"
        >
          <TrashIcon />
          {itemCount > 0 && <span>{itemCount}</span>}
        </button>
      </header>

      {items.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty__content">
            <span aria-hidden="true" className="cart-empty__icon">
              <BagIcon />
            </span>
            <h2>Giỏ hàng đang trống</h2>
            <p>Hãy thêm vài món để bắt đầu nhé</p>
          </div>
          <Link className="cart-empty__button" href="/#menu">Xem menu</Link>
        </section>
      ) : (
        <div className="cart-content">
          <section aria-label="Các món trong giỏ" className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item__image">
                  <Image alt={item.name} fill sizes="112px" src={item.imageUrl} />
                </div>
                <div className="cart-item__details">
                  <div className="cart-item__heading">
                    <div className="cart-item__name">
                      <h2>{item.name}</h2>
                      <p>Size {item.size}</p>
                      <p>
                        {item.toppings.length > 0
                          ? item.toppings.map((topping) => topping.name).join(", ")
                          : "Không topping"}
                      </p>
                      <p>
                        Đá:{" "}
                        {item.iceLevel === "LESS"
                          ? "Ít đá"
                          : item.iceLevel === "NONE"
                            ? "Không đá"
                            : "Bình thường"}
                      </p>
                    </div>
                    <button
                      aria-label={`Xóa ${item.name} khỏi giỏ`}
                      className="cart-icon-button"
                      onClick={() =>
                        setConfirmation({
                          kind: "remove",
                          id: item.id,
                          name: item.name,
                        })
                      }
                      type="button"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="cart-item__footer">
                    <div className="cart-quantity">
                      <button
                        aria-label={`Giảm số lượng ${item.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        type="button"
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        aria-label={`Tăng số lượng ${item.name}`}
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <strong>
                      {formatCurrency(
                        (item.unitPrice +
                          item.toppings.reduce(
                            (sum, topping) => sum + topping.price,
                            0,
                          )) *
                          item.quantity,
                      )}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {checkoutError && (
            <p className="cart-alert cart-alert--error" role="alert">{checkoutError}</p>
          )}

          <section aria-label="Tóm tắt đơn hàng" className="cart-summary">
            <div>
              <dt>Tạm tính</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="cart-summary__discount">
                <dt>Giảm giá ({appliedCode})</dt>
                <dd>−{formatCurrency(discount)}</dd>
              </div>
            )}
            <div className="cart-summary__total">
              <dt>Tổng cộng</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </section>

          <Link className="cart-promo-link" href="/cart/promotions">
            <span className="cart-promo-link__icon"><TagIcon /></span>
            <span>
              <strong>{appliedCode || "Mã giảm giá"}</strong>
              <small>
                {appliedCode
                  ? `Đã giảm ${formatCurrency(discount)}`
                  : "Chọn mã ưu đãi"}
              </small>
            </span>
            <span className="cart-promo-link__arrow">›</span>
          </Link>

          <button
            className="cart-checkout-button"
            disabled={isChecking}
            onClick={() => void placeOrder()}
            type="button"
          >
            {isChecking ? "Đang kiểm tra..." : "Đặt hàng"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {confirmation && (
        <div className="cart-modal-backdrop" role="presentation">
          <section
            aria-labelledby="cart-confirm-title"
            aria-modal="true"
            className="cart-confirm-dialog"
            role="alertdialog"
          >
            <span className="cart-confirm-dialog__icon"><AlertIcon /></span>
            <h2 id="cart-confirm-title">
              {confirmation.kind === "clear"
                ? "Xác nhận xóa toàn bộ giỏ hàng?"
                : `Xác nhận xóa ${confirmation.name}?`}
            </h2>
            <div className="cart-confirm-dialog__actions">
              <button className="is-danger" onClick={confirmRemoval} type="button">
                Xác nhận
              </button>
              <button onClick={() => setConfirmation(null)} type="button">Quay lại</button>
            </div>
          </section>
        </div>
      )}

      {validation && (
        <div className="cart-modal-backdrop" role="presentation">
          <section
            aria-labelledby="cart-stock-title"
            aria-modal="true"
            className="cart-stock-dialog"
            role="alertdialog"
          >
            <span className="cart-confirm-dialog__icon"><AlertIcon /></span>
            <h2 id="cart-stock-title">Một số món không đủ số lượng</h2>
            <ul>
              {validation.issues.map((issue, index) => (
                <li key={`${issue.productId}-${issue.reason}-${index}`}>
                  <strong>{issue.productName}</strong>
                  <span>
                    {issue.reason === "OUT_OF_STOCK"
                      ? issue.availableStock > 0
                        ? `Chỉ còn ${issue.availableStock} phần (bạn chọn ${issue.requestedQuantity})`
                        : "Đã hết hàng"
                      : issue.message}
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="cart-confirm-button"
              onClick={updateCartFromValidation}
              type="button"
            >
              Cập nhật giỏ hàng
            </button>
          </section>
        </div>
      )}

      {showLogin && (
        <div className="cart-modal-backdrop" role="presentation">
          <section
            aria-labelledby="cart-login-title"
            aria-modal="true"
            className="cart-confirm-dialog cart-login-dialog"
            role="dialog"
          >
            <span className="cart-login-icon"><UserIcon /></span>
            <h2 id="cart-login-title">Đăng nhập để đặt hàng</h2>
            <p>
              Bạn cần đăng nhập trước khi đặt hàng và thanh toán. Giỏ hàng sẽ
              được giữ nguyên.
            </p>
            <div className="cart-confirm-dialog__actions">
              <Link
                className="is-danger"
                href={loginUrl("/cart")}
                onClick={() => setShowLogin(false)}
              >
                Đăng nhập
              </Link>
              <Link href="/register" onClick={() => setShowLogin(false)}>
                Đăng ký tài khoản
              </Link>
            </div>
            <button className="cart-login-dismiss" onClick={() => setShowLogin(false)} type="button">
              Để sau
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M19 12H5m7 7-7-7 7-7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path d="M10 17h28l-2 24H12l-2-24Zm5 0 4-7h10l4 7m-14 8a5 5 0 0 0 10 0" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 13 11 22 2 13V4h9l9 9ZM7 8h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path d="m24 8 19 33H5L24 8Zm0 11v10m0 6h.01" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <circle cx="24" cy="15" r="8" />
      <path d="M9 42v-4a15 15 0 0 1 30 0v4" />
    </svg>
  );
}
