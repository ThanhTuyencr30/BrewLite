"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, cancelOrder, getOrder } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/api.types";
import { clearAccessToken, getAccessToken, loginUrl } from "@/lib/auth-token";
import { formatCurrency } from "@/lib/format";

type ViewMode = "DETAIL" | "TRACKING";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  PAYMENT_FAILED: "Thanh toán lỗi",
};

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "is-pending",
  PAID: "is-paid",
  PREPARING: "is-preparing",
  READY: "is-paid",
  COMPLETED: "is-paid",
  CANCELLED: "is-cancelled",
  PAYMENT_FAILED: "is-failed",
};

function formatOrderDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("DETAIL");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(loginUrl(`/orders/${id}`));
      return;
    }

    const controller = new AbortController();
    async function loadOrder(accessToken: string) {
      setIsLoading(true);
      setLoadError("");
      try {
        setOrder(await getOrder(id, accessToken, controller.signal));
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          clearAccessToken();
          router.replace(loginUrl(`/orders/${id}`));
          return;
        }
        setLoadError(
          error instanceof ApiError && error.status === 404
            ? "Không tìm thấy đơn hàng."
            : error instanceof Error
              ? error.message
              : "Không thể tải chi tiết đơn hàng.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrder(token);
    return () => controller.abort();
  }, [id, retryCount, router]);

  async function confirmCancel() {
    const token = getAccessToken();
    if (!token) {
      router.replace(loginUrl(`/orders/${id}`));
      return;
    }

    setIsCancelling(true);
    setActionError("");
    try {
      await cancelOrder(id, token);
      setShowCancelModal(false);
      setRetryCount((count) => count + 1);
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Không thể hủy đơn hàng.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <main aria-live="polite" className="order-detail-page">
        <p className="order-detail-message" role="status">
          Đang tải chi tiết đơn hàng...
        </p>
      </main>
    );
  }

  if (loadError || !order) {
    return (
      <main className="order-detail-page">
        <section className="order-detail-message" role="alert">
          <p>{loadError || "Không tìm thấy đơn hàng."}</p>
          <button
            className="order-detail-secondary"
            onClick={() => setRetryCount((count) => count + 1)}
            type="button"
          >
            Thử lại
          </button>
          <Link className="order-detail-link" href="/orders">
            Về lịch sử đặt hàng
          </Link>
        </section>
      </main>
    );
  }

  const canCancel = [
    "PENDING",
    "PAID",
    "PREPARING",
    "READY",
    "PAYMENT_FAILED",
  ].includes(order.status);

  return (
    <main className="order-detail-page">
      <header className="cart-screen-header">
        <Link
          aria-label="Quay lại lịch sử đặt hàng"
          className="cart-screen-back"
          href="/orders"
        >
          <BackIcon />
        </Link>
        <h1>Đơn hàng {order.code}</h1>
      </header>

      <div className="order-detail-content">
        <section className="order-detail-card">
          <div className="order-detail-card__header">
            <div>
              <span className="order-history-card__label">Mã đơn</span>
              <h2>{order.code}</h2>
            </div>
            <span className={`order-status ${statusClasses[order.status]}`}>
              {statusLabels[order.status]}
            </span>
          </div>
          <p className="order-detail-meta">
            Đặt lúc {formatOrderDate(order.createdAt)}
          </p>
        </section>

        <nav aria-label="Nội dung đơn hàng" className="order-detail-tabs">
          <button
            aria-pressed={viewMode === "DETAIL"}
            className={viewMode === "DETAIL" ? "is-active" : ""}
            onClick={() => setViewMode("DETAIL")}
            type="button"
          >
            Chi tiết
          </button>
          <button
            aria-pressed={viewMode === "TRACKING"}
            className={viewMode === "TRACKING" ? "is-active" : ""}
            onClick={() => setViewMode("TRACKING")}
            type="button"
          >
            Theo dõi đơn
          </button>
        </nav>

        {viewMode === "DETAIL" ? (
          <>
            <section aria-label="Sản phẩm trong đơn" className="order-detail-card">
              {order.items.map((item) => (
                <article className="order-detail-item" key={item.id}>
                  <span aria-hidden="true" className="order-detail-item__icon">
                    <CupIcon />
                  </span>
                  <div className="order-detail-item__copy">
                    <h3>{item.productName}</h3>
                    <p>
                      Size {item.size} · {item.quantity} sản phẩm
                    </p>
                    {(item.toppings ?? []).length > 0 && (
                      <p>
                        Topping: {item.toppings?.map((topping) => topping.toppingName).join(", ")}
                      </p>
                    )}
                  </div>
                  <strong>{formatCurrency(item.lineTotal)}</strong>
                </article>
              ))}
            </section>

            <section aria-label="Tổng tiền đơn hàng" className="order-detail-card order-detail-total">
              <div>
                <dt>Tạm tính</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="order-detail-total__discount">
                <dt>Giảm giá</dt>
                <dd>−{formatCurrency(order.discount)}</dd>
              </div>
              <div className="order-detail-total__grand">
                <dt>Tổng cộng</dt>
                <dd>{formatCurrency(order.total)}</dd>
              </div>
            </section>
          </>
        ) : (
          <section aria-label="Lịch sử trạng thái đơn hàng" className="order-detail-card">
            <h2 className="order-detail-section-title">Theo dõi đơn hàng</h2>
            {order.statusHistory?.length ? (
              <ol className="order-timeline">
                {[...order.statusHistory]
                  .sort(
                    (first, second) =>
                      new Date(first.changedAt).getTime() -
                      new Date(second.changedAt).getTime(),
                  )
                  .map((entry) => (
                    <li className="order-timeline__entry" key={entry.id}>
                      <span
                        aria-hidden="true"
                        className={`order-timeline__marker${entry.toStatus === order.status ? " is-current" : ""}`}
                      />
                      <div>
                        <strong>{statusLabels[entry.toStatus]}</strong>
                        <time dateTime={entry.changedAt}>
                          {formatOrderDate(entry.changedAt)}
                        </time>
                        {entry.note && <p>{entry.note}</p>}
                      </div>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="order-detail-meta">Chưa có cập nhật trạng thái.</p>
            )}
            {order.cancelReason && (
              <p className="order-detail-cancel-reason">
                Lý do hủy: {order.cancelReason}
              </p>
            )}
          </section>
        )}

        {actionError && !showCancelModal && (
          <p className="order-detail-error" role="alert">
            {actionError}
          </p>
        )}
      </div>

      <footer className="order-detail-footer">
        {viewMode === "DETAIL" ? (
          <button
            className="order-detail-primary"
            onClick={() => setViewMode("TRACKING")}
            type="button"
          >
            Theo dõi đơn hàng
          </button>
        ) : (
          <>
            {canCancel && (
              <button
                className="order-detail-danger"
                onClick={() => setShowCancelModal(true)}
                type="button"
              >
                Hủy đơn hàng
              </button>
            )}
            <button
              className="order-detail-secondary"
              onClick={() => setViewMode("DETAIL")}
              type="button"
            >
              Xem chi tiết đơn
            </button>
          </>
        )}
      </footer>

      {showCancelModal && (
        <div className="cart-modal-backdrop" role="presentation">
          <section
            aria-labelledby="order-cancel-title"
            aria-modal="true"
            className="cart-confirm-dialog"
            role="alertdialog"
          >
            <h2 id="order-cancel-title">Hủy đơn hàng?</h2>
            <p>
              Đơn {order.code} sẽ bị hủy. Thao tác này không thể hoàn tác.
            </p>
            {actionError && (
              <p className="order-detail-error" role="alert">
                {actionError}
              </p>
            )}
            <div className="cart-confirm-dialog__actions">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setActionError("");
                }}
                type="button"
              >
                Giữ đơn
              </button>
              <button
                className="is-danger"
                disabled={isCancelling}
                onClick={() => void confirmCancel()}
                type="button"
              >
                {isCancelling ? "Đang hủy..." : "Hủy đơn"}
              </button>
            </div>
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

function CupIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 8h13l-1 12H6L4 8Zm13 2h2a2 2 0 0 1 0 4h-2M8 4v2m5-2v2" />
    </svg>
  );
}
