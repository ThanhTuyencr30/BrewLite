"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import {
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  Icon,
  InlineBanner,
  QuantityStepper,
  TextField,
} from "@/components/ui";

export type CartLine = {
  id: string;
  name: string;
  image?: ReactNode;
  size?: string;
  toppings?: string[];
  quantity: number;
  unitPrice: number;
};

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3 border-b border-stone-100 py-4 last:border-0">
      <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-amber-100 text-2xl">
        {item.image ?? "☕"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-ink">{item.name}</h3>
            <p className="mt-1 text-xs text-ink-muted">
              {[item.size, ...(item.toppings ?? [])].filter(Boolean).join(" · ") || "Mặc định"}
            </p>
          </div>
          <button
            aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
            className="rounded-lg p-1 text-red-600"
            onClick={onRemove}
            type="button"
          >
            <Icon name="trash" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <QuantityStepper
            label={`Số lượng ${item.name}`}
            min={1}
            onChange={onQuantityChange}
            value={item.quantity}
          />
          <span className="text-sm font-bold text-caramel">
            {formatCurrency(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PriceSummary({
  subtotal,
  discount = 0,
  total,
}: {
  subtotal: number;
  discount?: number;
  total?: number;
}) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4 text-ink-muted">
        <dt>Tạm tính</dt>
        <dd>{formatCurrency(subtotal)}</dd>
      </div>
      {discount > 0 ? (
        <div className="flex justify-between gap-4 text-emerald-700">
          <dt>Giảm giá</dt>
          <dd>−{formatCurrency(discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 border-t border-stone-100 pt-3 text-base font-bold text-ink">
        <dt>Tổng cộng</dt>
        <dd>{formatCurrency(total ?? Math.max(0, subtotal - discount))}</dd>
      </div>
    </dl>
  );
}

export function OrderItemRow({
  item,
  showImage = false,
}: {
  item: CartLine;
  showImage?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {showImage ? (
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-xl">
          {item.image ?? "☕"}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
        <p className="text-xs text-ink-muted">
          {item.quantity} × {formatCurrency(item.unitPrice)}
          {item.size ? ` · ${item.size}` : ""}
        </p>
      </div>
      <span className="text-sm font-medium text-ink">
        {formatCurrency(item.quantity * item.unitPrice)}
      </span>
    </div>
  );
}

export function StockWarningList({
  products,
  onRefreshCart,
}: {
  products: { id: string; name: string; remaining?: number }[];
  onRefreshCart: () => void;
}) {
  return (
    <Card className="border border-amber-200 bg-amber-50">
      <h2 className="font-bold text-ink">Cần cập nhật giỏ hàng</h2>
      <ul className="my-3 space-y-2 text-sm text-ink-muted">
        {products.map((product) => (
          <li className="flex justify-between gap-3" key={product.id}>
            <span>{product.name}</span>
            <span>
              {product.remaining !== undefined && product.remaining > 0
                ? `Còn ${product.remaining}`
                : "Tạm hết hàng"}
            </span>
          </li>
        ))}
      </ul>
      <Button onClick={onRefreshCart} variant="secondary">
        Cập nhật giỏ hàng
      </Button>
    </Card>
  );
}

export function LoginRequiredDialog({
  onLogin,
  onDismiss,
}: {
  onLogin: () => void;
  onDismiss: () => void;
}) {
  return (
    <ConfirmDialog
      cancelLabel="Để sau"
      confirmLabel="Đăng nhập"
      description="Đăng nhập hoặc đăng ký để tiếp tục đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên."
      onCancel={onDismiss}
      onConfirm={onLogin}
      title="Bạn cần đăng nhập"
    />
  );
}

export function PaymentHeaderCard({
  amount,
  orderCode,
}: {
  amount: number;
  orderCode: string;
}) {
  return (
    <Card className="bg-caramel text-white">
      <p className="text-sm text-white/80">Tổng thanh toán</p>
      <p className="mt-1 text-3xl font-bold">{formatCurrency(amount)}</p>
      <p className="mt-3 text-xs text-white/80">Mã đơn: {orderCode}</p>
    </Card>
  );
}

export type PaymentMethod = "wallet" | "card" | "qr";

export function PaymentMethodList({
  value,
  onChange,
  includeQr = false,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  includeQr?: boolean;
}) {
  const methods: { value: PaymentMethod; label: string; detail: string }[] = [
    { value: "wallet", label: "Ví điện tử", detail: "Thanh toán nhanh và an toàn" },
    { value: "card", label: "Thẻ ngân hàng", detail: "Visa, Mastercard hoặc Napas" },
  ];
  if (includeQr) {
    methods.push({ value: "qr", label: "Chuyển khoản QR", detail: "Quét mã bằng ứng dụng ngân hàng" });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-3 font-bold text-ink">Phương thức thanh toán</legend>
      {methods.map((method) => (
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${value === method.value ? "border-caramel bg-amber-50" : "border-stone-200 bg-white"}`}
          key={method.value}
        >
          <input
            checked={value === method.value}
            className="mt-1 size-4 accent-caramel"
            name="paymentMethod"
            onChange={() => onChange(method.value)}
            type="radio"
            value={method.value}
          />
          <span>
            <span className="block text-sm font-semibold text-ink">{method.label}</span>
            <span className="mt-1 block text-xs text-ink-muted">{method.detail}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function CardForm() {
  return (
    <div className="space-y-4">
      <TextField
        autoComplete="cc-number"
        inputMode="numeric"
        label="Số thẻ"
        maxLength={19}
        name="cardNumber"
        placeholder="0000 0000 0000 0000"
        required
      />
      <TextField
        autoComplete="cc-name"
        label="Tên chủ thẻ"
        name="cardName"
        placeholder="NGUYEN VAN A"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          autoComplete="cc-exp"
          label="Ngày hết hạn"
          name="expiry"
          placeholder="MM/YY"
          required
        />
        <TextField
          autoComplete="cc-csc"
          inputMode="numeric"
          label="CVV"
          maxLength={4}
          name="cvv"
          placeholder="123"
          required
          type="password"
        />
      </div>
    </div>
  );
}

export function QRPayment({
  image,
  expired,
  onRegenerate,
}: {
  image?: ReactNode;
  expired: boolean;
  onRegenerate: () => void;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto grid size-48 place-items-center rounded-2xl bg-stone-100 p-4">
        {image ?? <span className="text-sm text-ink-muted">Mã QR thanh toán</span>}
      </div>
      {expired ? (
        <div className="mt-4">
          <InlineBanner tone="warning">Mã QR đã hết hạn</InlineBanner>
          <Button className="mt-3" onClick={onRegenerate} variant="secondary">
            Tạo mã QR mới
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">Quét mã để hoàn tất thanh toán</p>
      )}
    </Card>
  );
}

export function VoucherInput({
  onApply,
  disabled = false,
}: {
  onApply: (code: string) => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submitVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setError("Vui lòng nhập mã giảm giá.");
      return;
    }
    setError("");
    onApply(normalizedCode);
  }

  return (
    <form className="flex items-start gap-2" onSubmit={submitVoucher}>
      <TextField
        aria-label="Mã giảm giá"
        className="uppercase"
        disabled={disabled}
        error={error}
        onChange={(event) => {
          setCode(event.target.value);
          if (error) setError("");
        }}
        placeholder="Nhập mã giảm giá"
        value={code}
      />
      <Button className="shrink-0" disabled={disabled} type="submit">
        Áp dụng
      </Button>
    </form>
  );
}

export function VoucherCard({
  code,
  description,
  expiresAt,
  selected,
  disabled = false,
  onSelect,
}: {
  code: string;
  description: string;
  expiresAt: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${selected ? "border-caramel bg-amber-50" : "border-stone-200 bg-white"}`}>
      <input
        checked={selected}
        className="mt-1 size-4 accent-caramel"
        disabled={disabled}
        name="voucher"
        onChange={onSelect}
        type="radio"
      />
      <span className="flex-1">
        <span className="flex items-center gap-2 font-bold text-caramel">
          <Icon name="tag" className="size-4" />
          {code}
        </span>
        <span className="mt-1 block text-sm text-ink">{description}</span>
        <span className="mt-1 block text-xs text-ink-muted">HSD: {expiresAt}</span>
      </span>
    </label>
  );
}

export function AppliedVoucherBanner({
  code,
  discount,
  onRemove,
}: {
  code: string;
  discount: number;
  onRemove?: () => void;
}) {
  return (
    <InlineBanner tone="success">
      <div className="flex items-center justify-between gap-3">
        <span>
          Đã áp dụng <strong>{code}</strong> · giảm {formatCurrency(discount)}
        </span>
        {onRemove ? (
          <button className="font-semibold underline" onClick={onRemove} type="button">
            Gỡ
          </button>
        ) : null}
      </div>
    </InlineBanner>
  );
}

export function PaymentInfoRow({
  icon = "info",
  children,
}: {
  icon?: "clock" | "info";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      <Icon className="size-4" name={icon} />
      <span>{children}</span>
    </div>
  );
}

export function RewardRow({ points }: { points: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm">
      <span className="font-medium text-ink">Điểm thưởng nhận được</span>
      <span className="font-bold text-caramel">+{points} điểm</span>
    </div>
  );
}

export function PaymentSafeNote() {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-xs text-ink-muted">
      <Icon className="size-4" name="check" />
      Thanh toán an toàn
    </div>
  );
}

export function RemoveCartItemDialog({
  itemName,
  onRemove,
  onCancel,
}: {
  itemName: string;
  onRemove: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      confirmLabel="Xóa món"
      danger
      description={`Bạn có chắc muốn xóa ${itemName} khỏi giỏ hàng?`}
      onCancel={onCancel}
      onConfirm={onRemove}
      title="Xóa món khỏi giỏ?"
    />
  );
}

export function AppliedPrice({ amount }: { amount: number }) {
  return <span className="font-bold text-caramel">{formatCurrency(amount)}</span>;
}

export function VoucherCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return <Checkbox checked={checked} label={label} onChange={onChange} />;
}
