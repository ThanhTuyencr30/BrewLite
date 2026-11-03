"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "@/lib/api";
import { AuthShell } from "./auth-shell";
import styles from "./auth.module.css";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await requestPasswordReset(email.trim());
      setHasSubmitted(true);
    } catch {
      setError(
        "Chưa thể gửi yêu cầu lúc này. Vui lòng kiểm tra kết nối và thử lại.",
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
      subtitle="Nhập email đã đăng ký để nhận liên kết tạo mật khẩu mới."
      title="Quên mật khẩu"
    >
      {hasSubmitted ? (
        <div className={styles.resetNotice} role="status">
          <p>
            Nếu Gmail này đã đăng ký, liên kết xác nhận sẽ được gửi đến{" "}
            <strong>{email.trim()}</strong>. Mở email, nhấn liên kết để sang
            trang tạo mật khẩu mới và xác nhận lại mật khẩu. Hãy kiểm tra cả
            thư mục spam nhé.
          </p>
          <Link className={styles.authSubmit} href="/login">
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <form className={styles.authForm} onSubmit={handleSubmit}>
          <label className={styles.authField}>
            <span className={styles.authLabel}>Email</span>
            <input
              autoComplete="email"
              className={styles.authInput}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email của bạn"
              required
              type="email"
              value={email}
            />
          </label>
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
            {isSubmitting ? "Đang gửi xác nhận..." : "Xác nhận Gmail"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
