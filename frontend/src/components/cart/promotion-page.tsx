"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/format";
import { getPromotions, validatePromotion } from "@/lib/api";
import type { Promotion, PromotionValidation } from "@/lib/api.types";

export function PromotionPage() {
  const router = useRouter();
  const { items, appliedPromotion, setAppliedPromotion } = useCart();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [code, setCode] = useState(appliedPromotion?.promotion.code ?? "");
  const [selectedCode, setSelectedCode] = useState(
    appliedPromotion?.promotion.code ?? "",
  );
  const [preview, setPreview] = useState<PromotionValidation | null>(
    appliedPromotion,
  );
  const [promotionError, setPromotionError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

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
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const previewDiscount =
    preview?.promotion.code === selectedCode ? preview.discount : 0;
  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    void getPromotions(controller.signal)
      .then((result) => {
        if (isCurrent) {
          setPromotions(result);
        }
      })
      .catch((error: unknown) => {
        if (
          isCurrent &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách mã giảm giá.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });
    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, []);

  async function checkPromotion(promotionCode: string) {
    setPromotionError("");
    setIsApplying(true);
    try {
      const result = await validatePromotion(promotionCode, cartItems);
      setSelectedCode(result.promotion.code);
      setCode(result.promotion.code);
      setPreview(result);
    } catch (error: unknown) {
      setPreview(null);
      setPromotionError(
        error instanceof Error ? error.message : "Mã giảm giá không hợp lệ.",
      );
      setShowErrorDialog(true);
    } finally {
      setIsApplying(false);
    }
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setPromotionError("Vui lòng nhập mã giảm giá.");
      return;
    }
    setSelectedCode(normalized);
    void checkPromotion(normalized);
  }

  async function confirmPromotion() {
    if (!selectedCode) {
      setPromotionError("Vui lòng chọn hoặc nhập mã giảm giá.");
      return;
    }
    setIsApplying(true);
    setPromotionError("");
    try {
      const result = await validatePromotion(selectedCode, cartItems);
      setAppliedPromotion(result);
      router.push("/cart");
    } catch (error: unknown) {
      setPreview(null);
      setPromotionError(
        error instanceof Error ? error.message : "Mã giảm giá không hợp lệ.",
      );
      setShowErrorDialog(true);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <main className="promotion-page">
      <header className="promotion-screen-header">
        <Link aria-label="Quay lại giỏ hàng" className="promotion-screen-back" href="/cart">
          <BackIcon />
        </Link>
        <h1>Mã giảm giá</h1>
      </header>

      <form className="promotion-code-form" onSubmit={submitCode}>
        <label className="sr-only" htmlFor="promotion-code">Nhập mã giảm giá</label>
        <input
          autoCapitalize="characters"
          id="promotion-code"
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setPromotionError("");
            setPreview(null);
          }}
          placeholder="Nhập mã giảm giá"
          value={code}
        />
        <button disabled={!code.trim() || isApplying} type="submit">
          Áp dụng
        </button>
      </form>
      <h2 className="promotion-list-title">Hoặc chọn mã của bạn (1 mã/đơn)</h2>

      {promotionError && !showErrorDialog && (
        <p className="cart-alert cart-alert--error" role="alert">{promotionError}</p>
      )}

      <section aria-label="Danh sách mã giảm giá" className="promotion-list">
        {isLoading ? (
          <p className="promotion-empty-message" role="status">Đang tải mã giảm giá...</p>
        ) : loadError ? (
          <p className="cart-alert cart-alert--error" role="alert">{loadError}</p>
        ) : promotions.length === 0 ? (
          <div className="promotion-empty">
            <TicketIcon />
            <p>Hiện chưa có mã giảm giá nào</p>
          </div>
        ) : (
          promotions.map((promotion) => (
            <PromotionChoice
              key={promotion.id}
              onSelect={() => {
                setSelectedCode(promotion.code);
                setCode(promotion.code);
                setPromotionError("");
                void checkPromotion(promotion.code);
              }}
              promotion={promotion}
              selected={selectedCode === promotion.code}
            />
          ))
        )}
      </section>

      <footer className="promotion-footer">
        <section className="promotion-total" aria-label="Tóm tắt mã giảm giá">
          <div><dt>Tạm tính</dt><dd>{formatCurrency(subtotal)}</dd></div>
          <div><dt>Giảm giá{selectedCode ? ` (${selectedCode})` : ""}</dt><dd>−{formatCurrency(previewDiscount)}</dd></div>
          <div className="promotion-total__grand"><dt>Tổng cộng</dt><dd>{formatCurrency(Math.max(0, subtotal - previewDiscount))}</dd></div>
        </section>
        <button
          className="promotion-confirm-button"
          disabled={isApplying || items.length === 0}
          onClick={() => void confirmPromotion()}
          type="button"
        >
          {isApplying ? "Đang kiểm tra..." : "Xác nhận áp mã"}
        </button>
      </footer>

      {showErrorDialog && (
        <div className="cart-modal-backdrop" role="presentation">
          <section
            aria-labelledby="promotion-error-title"
            aria-modal="true"
            className="cart-confirm-dialog promotion-error-dialog"
            role="alertdialog"
          >
            <span className="cart-confirm-dialog__icon"><AlertIcon /></span>
            <h2 id="promotion-error-title">Mã giảm giá không hợp lệ</h2>
            <p>{promotionError}</p>
            <div className="cart-confirm-dialog__actions">
              <button
                className="is-danger"
                onClick={() => {
                  setShowErrorDialog(false);
                  setPromotionError("");
                }}
                type="button"
              >
                Chọn mã khác
              </button>
              <button
                onClick={() => {
                  setAppliedPromotion(null);
                  setShowErrorDialog(false);
                  router.push("/cart");
                }}
                type="button"
              >
                Tiếp tục không dùng mã
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function PromotionChoice({
  promotion,
  selected,
  onSelect,
}: {
  promotion: Promotion;
  selected: boolean;
  onSelect: () => void;
}) {
  const details =
    promotion.discountType === "PERCENT"
      ? `Giảm ${promotion.value}% cho đơn từ ${formatCurrency(promotion.minOrderValue)}`
      : `Giảm ${formatCurrency(promotion.value)} cho đơn từ ${formatCurrency(promotion.minOrderValue)}`;
  const expiry = promotion.endsAt.slice(0, 10).split("-").reverse().join("/");

  return (
    <button
      aria-pressed={selected}
      className={`promotion-choice${selected ? " is-selected" : ""}${promotion.isAvailable ? "" : " is-expired"}`}
      onClick={onSelect}
      type="button"
    >
      <span className="promotion-choice__tag"><TagIcon /></span>
      <span className="promotion-choice__copy">
        <strong>{promotion.code}</strong>
        <span>{promotion.description || details}</span>
        <small>
          {promotion.isAvailable
            ? `HSD: ${expiry}`
            : promotion.availabilityMessage || `Đã hết hạn ${expiry}`}
        </small>
      </span>
      <span
        aria-hidden="true"
        className={`promotion-choice__radio${selected ? " is-checked" : ""}`}
      />
    </button>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M19 12H5m7 7-7-7 7-7" />
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

function TicketIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 180">
      <path d="M42 19h126a20 20 0 0 0 0 40v62a20 20 0 0 0 0 40H42a20 20 0 0 0 0-40V59a20 20 0 0 0 0-40Z" />
      <circle cx="82" cy="88" r="17" />
      <circle cx="138" cy="88" r="17" />
      <path d="M110 54v69" />
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
