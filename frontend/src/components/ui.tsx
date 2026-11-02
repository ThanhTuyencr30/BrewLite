"use client";

import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "cart"
  | "check"
  | "clock"
  | "close"
  | "info"
  | "shield"
  | "star"
  | "tag"
  | "trash"
  | "user";

const iconPaths: Record<IconName, ReactNode> = {
  "arrow-left": <path d="m15 18-6-6 6-6M9 12h12" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  cart: (
    <>
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6" />
      <circle cx="10" cy="21" r="1" />
      <circle cx="18" cy="21" r="1" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  tag: <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />,
  trash: (
    <>
      <path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "link" | "neutral";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-caramel text-white hover:bg-caramel-dark",
  secondary: "border border-caramel text-caramel hover:bg-caramel/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
  link: "text-red-700 hover:underline",
  neutral: "bg-stone-700 text-white hover:bg-stone-800",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          aria-label="Đang tải"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          role="status"
        />
      ) : null}
      {children}
    </button>
  );
}

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function FormError({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-red-700">{children}</p>;
}

export function TextField({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;

  return (
    <div className="w-full">
      {label ? (
        <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-caramel focus:ring-2 focus:ring-caramel/15 disabled:bg-stone-100 ${error ? "border-red-500" : "border-stone-200"} ${className}`}
        id={inputId}
        {...props}
      />
      {error ? (
        <div id={`${inputId}-error`}>
          <FormError>{error}</FormError>
        </div>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted" id={`${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type PasswordFieldProps = Omit<TextFieldProps, "type">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextField {...props} className={`pr-16 ${props.className ?? ""}`} type={visible ? "text" : "password"} />
      <button
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-3 top-[2.35rem] rounded px-1 py-1 text-xs font-semibold text-caramel focus-visible:outline-2 focus-visible:outline-caramel"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? "Ẩn" : "Hiện"}
      </button>
    </div>
  );
}

export function Checkbox({
  label,
  priceLabel,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; priceLabel?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-ink">
      <input className="size-4 accent-caramel" type="checkbox" {...props} />
      <span className="flex flex-1 justify-between gap-3">
        <span>{label}</span>
        {priceLabel ? <span className="text-ink-muted">{priceLabel}</span> : null}
      </span>
    </label>
  );
}

export function Radio({
  label,
  priceLabel,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; priceLabel?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-ink">
      <input className="size-4 accent-caramel" type="radio" {...props} />
      <span className="flex flex-1 justify-between gap-3">
        <span>{label}</span>
        {priceLabel ? <span className="text-ink-muted">{priceLabel}</span> : null}
      </span>
    </label>
  );
}

export function QuantityStepper({
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
  label = "Số lượng",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <div aria-label={label} className="inline-flex items-center gap-3" role="group">
      <button
        aria-label="Giảm số lượng"
        className="grid size-9 place-items-center rounded-full border border-stone-200 text-lg disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
      >
        −
      </button>
      <output aria-live="polite" className="min-w-5 text-center text-sm font-semibold">
        {value}
      </output>
      <button
        aria-label="Tăng số lượng"
        className="grid size-9 place-items-center rounded-full border border-stone-200 text-lg disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        type="button"
      >
        +
      </button>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div aria-label={label} className="inline-flex rounded-xl bg-stone-100 p-1" role="group">
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={`rounded-lg px-3 py-2 text-sm transition ${value === option.value ? "bg-white font-semibold text-caramel shadow-sm" : "text-ink-muted"}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng nhận",
  COMPLETED: "Hoàn tất",
  PAYMENT_FAILED: "Thanh toán lỗi",
  CANCELLED: "Đã hủy",
};

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  PREPARING: "bg-sky-100 text-sky-800",
  READY: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  PAYMENT_FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-stone-100 text-stone-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`rounded-3xl bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-stone-200 ${className}`} />;
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function InlineBanner({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const tones = {
    info: "bg-amber-50 text-amber-900",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-yellow-50 text-yellow-900",
    danger: "bg-red-50 text-red-800",
  };

  return <div className={`rounded-2xl px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-amber-100 text-caramel">
        <Icon name="cart" className="size-7" />
      </span>
      <h2 className="font-bold text-ink">{title}</h2>
      <p className="max-w-xs text-sm text-ink-muted">{description}</p>
      {action}
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Để sau",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
        role="dialog"
      >
        <h2 className="text-lg font-bold text-ink" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button className="flex-1" onClick={onConfirm} variant={danger ? "danger" : "primary"}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function ResultDialog({
  title,
  description,
  success,
  onClose,
}: {
  title: string;
  description: string;
  success: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section
        aria-labelledby="result-dialog-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl bg-amber-50 p-6 text-center shadow-xl"
        role="dialog"
      >
        <span className={`mx-auto grid size-12 place-items-center rounded-full ${success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          <Icon name={success ? "check" : "close"} />
        </span>
        <h2 className="mt-3 font-bold text-ink" id="result-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
        <Button className="mt-5 w-full" onClick={onClose}>
          Đóng
        </Button>
      </section>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-cream px-4 pb-8 pt-5 shadow-xl sm:px-5">
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex min-h-11 items-center gap-3">
      {onBack ? (
        <button
          aria-label="Quay lại"
          className="grid size-10 place-items-center rounded-full bg-white text-ink"
          onClick={onBack}
          type="button"
        >
          <Icon name="arrow-left" />
        </button>
      ) : null}
      <h1 className="flex-1 text-xl font-bold text-ink">{title}</h1>
      {action}
    </header>
  );
}

export function HomeHeader({
  itemCount = 0,
  onCartClick,
  onProfileClick,
}: {
  itemCount?: number;
  onCartClick?: () => void;
  onProfileClick?: () => void;
}) {
  return (
    <header className="mb-7 flex items-center justify-between">
      <div>
        <p className="text-xl font-black tracking-tight text-caramel">BrewLite</p>
        <p className="text-xs text-ink-muted">Một chút dịu dàng trong ngày</p>
      </div>
      <div className="flex gap-2">
        <button
          aria-label="Tài khoản"
          className="grid size-10 place-items-center rounded-full bg-white text-ink"
          onClick={onProfileClick}
          type="button"
        >
          <Icon name="user" />
        </button>
        <button
          aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
          className="relative grid size-10 place-items-center rounded-full bg-white text-ink"
          onClick={onCartClick}
          type="button"
        >
          <Icon name="cart" />
          <CountBadge count={itemCount} />
        </button>
      </div>
    </header>
  );
}

export function BottomActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-stone-100 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-5">
      {children}
    </div>
  );
}

export function CategoryRail({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <nav aria-label="Danh mục sản phẩm" className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          aria-current={selected === category ? "true" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-sm ${selected === category ? "bg-caramel text-white" : "bg-white text-ink-muted"}`}
          key={category}
          onClick={() => onSelect(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </nav>
  );
}
