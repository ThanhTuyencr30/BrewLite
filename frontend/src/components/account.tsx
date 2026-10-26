"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Button,
  Card,
  Icon,
  PasswordField,
  TextField,
  type IconName,
} from "@/components/ui";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <div className="mb-7 text-center">
        <p className="text-3xl font-black tracking-tight text-caramel">BrewLite</p>
        <p className="mt-1 text-sm text-ink-muted">Một chút dịu dàng trong ngày</p>
      </div>
      <Card>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </Card>
    </div>
  );
}

export function LoginForm({
  onSubmit,
  loading = false,
}: {
  onSubmit: (credentials: { email: string; password: string }) => void;
  loading?: boolean;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <TextField
        autoComplete="email"
        label="Email"
        name="email"
        placeholder="ban@email.com"
        required
        type="email"
      />
      <PasswordField
        autoComplete="current-password"
        label="Mật khẩu"
        name="password"
        placeholder="Nhập mật khẩu"
        required
      />
      <Button fullWidth loading={loading} type="submit">
        Đăng nhập
      </Button>
    </form>
  );
}

export function RegisterForm({
  onSubmit,
  loading = false,
}: {
  onSubmit: (credentials: { email: string; password: string }) => void;
  loading?: boolean;
}) {
  const [passwordError, setPasswordError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setPasswordError("");
    onSubmit({ email: String(formData.get("email") ?? ""), password });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <TextField
        autoComplete="email"
        label="Email"
        name="email"
        placeholder="ban@email.com"
        required
        type="email"
      />
      <PasswordField
        autoComplete="new-password"
        label="Mật khẩu"
        minLength={8}
        name="password"
        placeholder="Tối thiểu 8 ký tự"
        required
      />
      <PasswordField
        autoComplete="new-password"
        error={passwordError}
        label="Xác nhận mật khẩu"
        minLength={8}
        name="confirmPassword"
        onChange={() => {
          if (passwordError) setPasswordError("");
        }}
        placeholder="Nhập lại mật khẩu"
        required
      />
      <Button fullWidth loading={loading} type="submit">
        Tạo tài khoản
      </Button>
    </form>
  );
}

export function ProfileCard({
  name,
  email,
  membership,
  avatar,
}: {
  name: string;
  email: string;
  membership: string;
  avatar?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-amber-100 text-lg font-bold text-caramel">
        {avatar ?? name.trim().charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <h2 className="truncate font-bold text-ink">{name}</h2>
        <p className="truncate text-sm text-ink-muted">{email}</p>
        <p className="mt-1 text-xs font-semibold text-caramel">{membership}</p>
      </div>
    </Card>
  );
}

export function LoyaltyCard({
  points,
  tier,
  nextTier,
  pointsToNextTier,
}: {
  points: number;
  tier: string;
  nextTier?: string;
  pointsToNextTier?: number;
}) {
  return (
    <Card className="bg-gradient-to-br from-caramel to-caramel-dark text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/80">Hạng thành viên</span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{tier}</span>
      </div>
      <p className="mt-4 text-3xl font-bold">{points.toLocaleString("vi-VN")}</p>
      <p className="text-sm text-white/80">điểm tích lũy</p>
      {nextTier && pointsToNextTier !== undefined ? (
        <p className="mt-4 border-t border-white/20 pt-3 text-xs text-white/80">
          Còn {pointsToNextTier} điểm để lên hạng {nextTier}
        </p>
      ) : null}
    </Card>
  );
}

export function ListMenuItem({
  icon,
  label,
  description,
  onClick,
}: {
  icon: IconName;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 border-b border-stone-100 py-4 text-left last:border-0"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-caramel">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-ink-muted">{description}</span> : null}
      </span>
      <Icon className="size-4 rotate-180 text-ink-muted" name="arrow-left" />
    </button>
  );
}
