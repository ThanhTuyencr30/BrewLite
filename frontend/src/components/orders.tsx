"use client";

import { formatCurrency } from "@/lib/format";
import type { ReactNode } from "react";
import {
  Button,
  Card,
  Icon,
  InlineBanner,
  StatusBadge,
  type OrderStatus,
} from "@/components/ui";

export type OrderFilter = "all" | "processing" | "completed" | "cancelled";

const filterLabels: Record<OrderFilter, string> = {
  all: "Tất cả",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export function OrderStatusTabs({
  value,
  onChange,
}: {
  value: OrderFilter;
  onChange: (filter: OrderFilter) => void;
}) {
  return (
    <div aria-label="Lọc đơn hàng" className="flex gap-2 overflow-x-auto pb-2" role="group">
      {(Object.keys(filterLabels) as OrderFilter[]).map((filter) => (
        <button
          aria-pressed={value === filter}
          className={`shrink-0 rounded-full px-4 py-2 text-sm ${value === filter ? "bg-caramel text-white" : "bg-white text-ink-muted"}`}
          key={filter}
          onClick={() => onChange(filter)}
          type="button"
        >
          {filterLabels[filter]}
        </button>
      ))}
    </div>
  );
}

export function OrderCard({
  code,
  status,
  summary,
  createdAt,
  total,
  onViewDetails,
}: {
  code: string;
  status: OrderStatus;
  summary: string;
  createdAt: string;
  total: number;
  onViewDetails: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-muted">Mã đơn</p>
          <p className="mt-1 font-bold text-ink">{code}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-ink">{summary}</p>
      <p className="mt-2 text-xs text-ink-muted">{createdAt}</p>
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
        <div>
          <p className="text-xs text-ink-muted">Tổng cộng</p>
          <p className="mt-1 font-bold text-caramel">{formatCurrency(total)}</p>
        </div>
        <Button onClick={onViewDetails} variant="secondary">
          Xem chi tiết
        </Button>
      </div>
    </Card>
  );
}

const orderSteps: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Chờ thanh toán" },
  { status: "PAID", label: "Đã thanh toán" },
  { status: "PREPARING", label: "Đang pha chế" },
  { status: "READY", label: "Sẵn sàng nhận" },
  { status: "COMPLETED", label: "Hoàn tất" },
];

export function OrderTimeline({
  status,
  timestamps = {},
}: {
  status: OrderStatus;
  timestamps?: Partial<Record<OrderStatus, string>>;
}) {
  const currentIndex = orderSteps.findIndex((step) => step.status === status);
  const failed = status === "PAYMENT_FAILED" || status === "CANCELLED";

  return (
    <ol aria-label="Tiến trình đơn hàng" className="space-y-0">
      {failed ? (
        <li className="relative flex gap-3 pb-5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
            <Icon className="size-4" name={status === "CANCELLED" ? "close" : "info"} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-red-700">
              {status === "CANCELLED" ? "Đơn hàng đã hủy" : "Thanh toán không thành công"}
            </span>
            {timestamps[status] ? (
              <span className="mt-1 block text-xs text-ink-muted">{timestamps[status]}</span>
            ) : null}
          </span>
        </li>
      ) : null}
      {orderSteps.map((step, index) => {
        const isDone = !failed && currentIndex >= index;
        const isCurrent = !failed && currentIndex === index;

        return (
          <li className="relative flex gap-3 pb-5 last:pb-0" key={step.status}>
            {index < orderSteps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px ${isDone && currentIndex > index ? "bg-caramel" : "bg-stone-200"}`}
              />
            ) : null}
            <span
              className={`relative z-[1] grid size-7 shrink-0 place-items-center rounded-full ${isDone ? "bg-caramel text-white" : "bg-stone-100 text-ink-muted"}`}
            >
              {isDone ? <Icon className="size-4" name="check" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <span className="pt-1">
              <span className={`block text-sm ${isCurrent ? "font-bold text-ink" : "text-ink-muted"}`}>
                {step.label}
              </span>
              {timestamps[step.status] ? (
                <span className="mt-1 block text-xs text-ink-muted">{timestamps[step.status]}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function RefundSummary({
  amount,
  expectedAt,
  rewardPoints,
}: {
  amount: number;
  expectedAt: string;
  rewardPoints?: number;
}) {
  return (
    <Card>
      <h2 className="mb-3 font-bold text-ink">Thông tin hoàn tiền</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Số tiền hoàn</dt>
          <dd className="font-semibold text-ink">{formatCurrency(amount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Dự kiến hoàn</dt>
          <dd className="text-right text-ink">{expectedAt}</dd>
        </div>
        {rewardPoints !== undefined ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Điểm thưởng thu hồi</dt>
            <dd className="text-ink">{rewardPoints} điểm</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

export function StatusScreen({
  status,
  title,
  description,
  action,
}: {
  status: "success" | "fail" | "processing" | "expired" | "cancelled";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const iconName =
    status === "success"
      ? "check"
      : status === "processing"
        ? "clock"
        : status === "expired"
          ? "info"
          : "close";
  const iconTone =
    status === "success"
      ? "bg-emerald-100 text-emerald-700"
      : status === "processing"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className={`grid size-20 place-items-center rounded-full ${iconTone}`}>
        <Icon className="size-9" name={iconName} />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 max-w-xs text-sm leading-6 text-ink-muted">{description}</p>
      {action ? <div className="mt-6 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}

export function KeyValueList({
  rows,
}: {
  rows: { label: string; value: string; emphasized?: boolean }[];
}) {
  return (
    <dl className="space-y-3">
      {rows.map((row) => (
        <div className="flex justify-between gap-4" key={row.label}>
          <dt className="text-sm text-ink-muted">{row.label}</dt>
          <dd className={`text-right text-sm ${row.emphasized ? "font-bold text-caramel" : "font-medium text-ink"}`}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BaristaOrderRow({
  code,
  status,
  onAdvance,
}: {
  code: string;
  status: OrderStatus;
  onAdvance: () => void;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="font-bold text-ink">{code}</p>
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
      </div>
      <Button onClick={onAdvance}>Chuyển trạng thái</Button>
    </Card>
  );
}

export function OrderFailureNote({ children }: { children: ReactNode }) {
  return <InlineBanner tone="danger">{children}</InlineBanner>;
}
