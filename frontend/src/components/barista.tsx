"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import {
  Button,
  Card,
  InlineBanner,
  PageHeader,
} from "@/components/ui";
import type { BaristaOrder, BaristaOrderStatus } from "@/lib/catalog";

const initialOrders: BaristaOrder[] = [
  {
    id: "CC-000004",
    status: "PAID",
    itemCount: 4,
    total: 119000,
    placedAt: "09:36",
  },
  {
    id: "CC-000005",
    status: "PREPARING",
    itemCount: 4,
    total: 119000,
    placedAt: "09:36",
  },
  {
    id: "CC-000006",
    status: "READY",
    itemCount: 4,
    total: 119000,
    placedAt: "09:36",
  },
];

const nextStatuses: Partial<Record<BaristaOrderStatus, BaristaOrderStatus>> = {
  PAID: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

const actionLabels: Partial<Record<BaristaOrderStatus, string>> = {
  PAID: "Nhận pha chế → PREPARING",
  PREPARING: "Pha xong → READY",
  READY: "Giao khách → COMPLETED",
};

export function BaristaScreen({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState(initialOrders);

  function advanceOrder(order: BaristaOrder) {
    const nextStatus = nextStatuses[order.status];
    if (!nextStatus) return;
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item,
      ),
    );
  }

  return (
    <>
      <PageHeader onBack={onBack} title="Quầy pha chế (demo)" />
      <div className="space-y-4">
        <InlineBanner tone="warning">
          Màn giả lập barista để demo state machine, ngoài phạm vi MVP.
        </InlineBanner>
        {orders.map((order) => {
          const nextStatus = nextStatuses[order.status];
          return (
            <Card className="border border-[#ead9c4] p-4" key={order.id}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">#{order.id}</h2>
                <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-800">
                  {order.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                {order.itemCount} sản phẩm · {formatCurrency(order.total)} · Đặt lúc{" "}
                {order.placedAt}
              </p>
              {nextStatus ? (
                <Button
                  className="mt-3 min-h-11 w-full"
                  onClick={() => advanceOrder(order)}
                  variant="neutral"
                >
                  {actionLabels[order.status]}
                </Button>
              ) : (
                <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
                  Đơn hàng đã hoàn tất
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
