"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { resetPassword } from "@/lib/api";
import { PasswordVisibilityToggle } from "./password-visibility-toggle";
import { AuthShell } from "./auth-shell";
import styles from "./auth.module.css";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      router.replace("/login");
    }, 2500);

    return () => window.clearTimeout(redirectTimer);
  }, [isComplete, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await resetPassword(token, password);
      setIsComplete(true);
    } catch {
      setError(
        "Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu một liên kết mới.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      footer={
        <>
          Nhớ mật khẩu rồi?
          <Link href="/login">Đăng nhập</Link>
        </>
      }
      subtitle="Tạo mật khẩu mới có ít nhất 8 ký tự."
      title="Đặt lại mật khẩu"
    >
      {!token ? (
        <div className={styles.resetNotice} role="alert">
          <p>Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          <Link className={styles.authSubmit} href="/forgot-password">
            Yêu cầu liên kết mới
          </Link>
        </div>
      ) : isComplete ? (
        <div className={styles.resetNotice} role="status">
          <p>
            Mật khẩu đã được cập nhật thành công. Đang chuyển về trang đăng
            nhập...
          </p>
          <Link className={styles.authSubmit} href="/login">
            Đến đăng nhập
          </Link>
        </div>
      ) : (
        <form className={styles.authForm} onSubmit={handleSubmit}>
          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            onChange={setPassword}
            onToggle={() => setShowPassword((visible) => !visible)}
            value={password}
            visible={showPassword}
          />
          <PasswordField
            id="confirm-password"
            label="Xác nhận mật khẩu"
            onChange={setConfirmation}
            onToggle={() => setShowConfirmation((visible) => !visible)}
            value={confirmation}
            visible={showConfirmation}
          />
          {error && (
            <p className={styles.fieldError} role="alert">
              {error}
            </p>
          )}
          <button
            className={styles.authSubmit}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function PasswordField({
  id,
  label,
  onChange,
  onToggle,
  value,
  visible,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  value: string;
  visible: boolean;
}) {
  return (
    <div className={styles.authField}>
      <label className={styles.authLabel} htmlFor={id}>
        {label}
      </label>
      <span className={styles.authInputWrap}>
        <input
          autoComplete="new-password"
          className={`${styles.authInput} ${styles["authInput--withAction"]}`}
          id={id}
          minLength={8}
          onChange={(event) => onChange(event.target.value)}
          required
          type={visible ? "text" : "password"}
          value={value}
        />
        <PasswordVisibilityToggle visible={visible} onToggle={onToggle} />
      </span>
    </div>
  );
}
