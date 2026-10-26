"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { AuthResultDialog, type DialogTone } from "./auth-result-dialog";
import { AuthShell } from "./auth-shell";
import styles from "./auth.module.css";

const ACCESS_TOKEN_KEY = "accessToken";

interface DialogState {
  tone: DialogTone;
  title: string;
  message: string;
  primaryLabel: string;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password });
      window.localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
      setDialog({
        tone: "success",
        title: "Đăng nhập thành công",
        message: "Chào mừng bạn quay trở lại COLDEN COFFEE.",
        primaryLabel: "Vào tài khoản",
      });
    } catch {
      setDialog({
        tone: "error",
        title: "Đăng nhập thất bại",
        message: "Email hoặc mật khẩu chưa chính xác. Hãy kiểm tra và thử lại nhé.",
        primaryLabel: "Thử lại",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function continueToAccount() {
    if (dialog?.tone === "success") {
      router.push("/profile");
      return;
    }

    setDialog(null);
  }

  return (
    <AuthShell
      footer={
        <>
          Chưa có tài khoản?
          <Link href="/register">Đăng ký ngay</Link>
        </>
      }
      subtitle="Chào mừng bạn quay trở lại!"
      title="Đăng nhập"
    >
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <label className={styles.authField}>
          <span className={styles.authLabel}>Email</span>
          <input
            autoComplete="email"
            className={styles.authInput}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Nhập email của bạn"
            required
            type="email"
            value={email}
          />
        </label>

        <div className={styles.authField}>
          <label className={styles.authLabel} htmlFor="login-password">
            Mật khẩu
          </label>
          <span className={styles.authInputWrap}>
            <input
              id="login-password"
              autoComplete="current-password"
              className={`${styles.authInput} ${styles["authInput--withAction"]}`}
              minLength={6}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              className={styles.passwordToggle}
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </span>
        </div>

        <button
          className={styles.authSubmit}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
          {!isSubmitting && <span className={styles.submitArrow} aria-hidden="true">→</span>}
        </button>
      </form>

      {dialog && (
        <AuthResultDialog
          message={dialog.message}
          onPrimary={continueToAccount}
          onSecondary={() => setDialog(null)}
          primaryLabel={dialog.primaryLabel}
          tone={dialog.tone}
          title={dialog.title}
        />
      )}
    </AuthShell>
  );
}
