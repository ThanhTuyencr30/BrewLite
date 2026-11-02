"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, getMyOrders } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/api.types";
import { clearAccessToken, getAccessToken, loginUrl } from "@/lib/auth-token";
import { formatCurrency } from "@/lib/format";

type OrderFilter = "ALL" | "PROCESSING" | "COMPLETED" | "CANCELLED";

const tabs: { id: OrderFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "PROCESSING", label: "Đang xử lý" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã hủy" },
];

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

function getOrderSummary(order: Order) {
  if (order.items.length === 0) {
    return "Đơn hàng không có sản phẩm";
  }

  const firstItem = order.items[0];
  const remainingCount = order.items.length - 1;
  return `${firstItem.productName} × ${firstItem.quantity}${
    remainingCount > 0 ? `, +${remainingCount} món khác` : ""
  }`;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderFilter>("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(loginUrl("/orders"));
      return;
    }

    const controller = new AbortController();
    async function loadOrders(accessToken: string) {
      setIsLoading(true);
      setLoadError("");
      try {
        setOrders(await getMyOrders(accessToken, controller.signal));
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          clearAccessToken();
          router.replace(loginUrl("/orders"));
          return;
        }
        setLoadError(
          error instanceof Error
            ? error.message
            : "Không thể tải lịch sử đặt hàng.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders(token);
    return () => controller.abort();
  }, [retryCount, router]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (activeTab === "ALL") return true;
        if (activeTab === "PROCESSING") {
          return ["PENDING", "PAID", "PREPARING", "READY"].includes(order.status);
        }
        return order.status === activeTab;
      }),
    [activeTab, orders],
  );

  return (
    <main className="order-history-page">
      <header className="cart-screen-header">
        <Link aria-label="Quay lại" className="cart-screen-back" href="/">
          <BackIcon />
        </Link>
        <h1>Lịch sử đặt hàng</h1>
      </header>

      <nav aria-label="Lọc đơn hàng" className="order-history-tabs">
        {tabs.map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            className={`order-history-tab${activeTab === tab.id ? " is-active" : ""}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section aria-label="Đơn hàng của bạn" className="order-history-list">
        {isLoading ? (
          <p aria-live="polite" className="order-history-message" role="status">
            Đang tải lịch sử đặt hàng...
          </p>
        ) : loadError ? (
          <div className="order-history-message" role="alert">
            <p>{loadError}</p>
            <button
              className="order-history-retry"
              onClick={() => setRetryCount((count) => count + 1)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="order-history-message">
            <p>
              {orders.length === 0
                ? "Bạn chưa có đơn hàng nào."
                : "Không có đơn hàng nào trong mục này."}
            </p>
            {orders.length === 0 && (
              <Link className="order-history-menu-link" href="/">
                Khám phá menu
              </Link>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <article className="order-history-card" key={order.id}>
              <div className="order-history-card__header">
                <div>
                  <span className="order-history-card__label">Mã đơn</span>
                  <h2>{order.code}</h2>
                </div>
                <span className={`order-status ${statusClasses[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>

              <p className="order-history-card__summary">
                {getOrderSummary(order)}
              </p>
              <p className="order-history-card__meta">
                {order.items.reduce((count, item) => count + item.quantity, 0)} sản phẩm
                {" · "}
                {formatOrderDate(order.createdAt)}
              </p>

              <div className="order-history-card__footer">
                <div>
                  <span className="order-history-card__label">Tổng cộng</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
                <Link href={`/orders/${order.id}`}>Xem chi tiết</Link>
              </div>
            </article>
          ))
        )}
      </section>
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
