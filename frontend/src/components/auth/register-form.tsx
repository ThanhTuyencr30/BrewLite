"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, register } from "@/lib/api";
import { AuthResultDialog, type DialogTone } from "./auth-result-dialog";
import { AuthShell } from "./auth-shell";
import styles from "./auth.module.css";

type RegisterField = "email" | "password" | "confirmation";
type RegisterErrors = Partial<Record<RegisterField, string>>;

interface DialogState {
  tone: DialogTone;
  title: string;
  message: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [dialog, setDialog] = useState<DialogState | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: RegisterErrors = {};
    if (password.length < 8) {
      nextErrors.password = "Mật khẩu cần tối thiểu 8 ký tự.";
    }
    if (password !== confirmation) {
      nextErrors.confirmation = "Mật khẩu xác nhận không khớp.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email: email.trim(), password });
      setDialog({
        tone: "success",
        title: "Đăng ký thành công",
        message: "Chào mừng bạn đến với BrewLite. Đăng nhập để bắt đầu nhé!",
      });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: "Email này đã được sử dụng." });
        return;
      }

      setDialog({
        tone: "error",
        title: "Đăng ký chưa thành công",
        message: "Đã có lỗi khi tạo tài khoản. Vui lòng kiểm tra kết nối và thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderPasswordField(
    field: "password" | "confirmation",
    label: string,
    placeholder: string,
    value: string,
    onChange: (nextValue: string) => void,
  ) {
    const error = errors[field];
    return (
      <div className={styles.authField}>
        <label className={styles.authLabel} htmlFor={`register-${field}`}>
          {label}
        </label>
        <span className={styles.authInputWrap}>
          <input
            id={`register-${field}`}
            autoComplete="new-password"
            aria-describedby={error ? `${field}-error` : undefined}
            aria-invalid={Boolean(error)}
            className={`${styles.authInput} ${styles["authInput--withAction"]} ${error ? styles["authInput--error"] : ""}`}
            onChange={(event) => {
              onChange(event.target.value);
              setErrors((current) => ({ ...current, [field]: undefined }));
            }}
            placeholder={placeholder}
            required
            type={showPasswords ? "text" : "password"}
            value={value}
          />
          {field === "password" && (
            <button
              aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPasswords}
              className={styles.passwordToggle}
              onClick={() => setShowPasswords((visible) => !visible)}
              type="button"
            >
              {showPasswords ? "Ẩn" : "Hiện"}
            </button>
          )}
        </span>
        {error ? (
          <span className={styles.fieldError} id={`${field}-error`}>
            {error}
          </span>
        ) : field === "password" ? (
          <span className={styles.fieldHint}>Ít nhất 8 ký tự</span>
        ) : null}
      </div>
    );
  }

  return (
    <AuthShell
      footer={
        <>
          Đã có tài khoản?
          <Link href="/login">Đăng nhập</Link>
        </>
      }
      subtitle="Tạo tài khoản để nhận thêm yêu thương."
      title="Đăng ký tài khoản"
    >
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <label className={styles.authField}>
          <span className={styles.authLabel}>Email</span>
          <input
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            className={`${styles.authInput} ${errors.email ? styles["authInput--error"] : ""}`}
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder="Nhập email của bạn"
            required
            type="email"
            value={email}
          />
          {errors.email && (
            <span className={styles.fieldError} id="email-error">
              {errors.email}
            </span>
          )}
        </label>

        {renderPasswordField(
          "password",
          "Mật khẩu",
          "Nhập mật khẩu của bạn",
          password,
          setPassword,
        )}
        {renderPasswordField(
          "confirmation",
          "Xác nhận mật khẩu",
          "Nhập lại mật khẩu của bạn",
          confirmation,
          setConfirmation,
        )}

        <button
          className={styles.authSubmit}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Đang tạo tài khoản…" : "Đăng ký"}
          {!isSubmitting && <span className={styles.submitArrow} aria-hidden="true">→</span>}
        </button>
      </form>

      {dialog && (
        <AuthResultDialog
          message={dialog.message}
          onPrimary={() => {
            if (dialog.tone === "success") {
              router.push("/login");
              return;
            }
            setDialog(null);
          }}
          onSecondary={() => setDialog(null)}
          primaryLabel={dialog.tone === "success" ? "Đến đăng nhập" : "Thử lại"}
          tone={dialog.tone}
          title={dialog.title}
        />
      )}
    </AuthShell>
  );
}
