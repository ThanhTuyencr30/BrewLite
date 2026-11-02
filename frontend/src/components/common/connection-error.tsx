"use client";

import { useRouter } from "next/navigation";

interface ConnectionErrorProps {
  onRetry: () => void;
  onHome?: () => void;
}

export function ConnectionError({ onRetry, onHome }: ConnectionErrorProps) {
  const router = useRouter();

  return (
    <main className="coffee-app connection-page" aria-labelledby="connection-title">
      <section className="connection-page__message">
        <span className="connection-page__icon" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <path d="M11 25c12-11 30-11 42 0" />
            <path d="M18 33c8-7 20-7 28 0" />
            <path d="M26 42c3.5-3 8.5-3 12 0" />
            <circle cx="32" cy="51" r="1.8" fill="currentColor" stroke="none" />
            <path d="M10 10l44 44" />
          </svg>
        </span>
        <h1 id="connection-title">Không thể kết nối</h1>
        <p>Vui lòng kiểm tra mạng và thử lại</p>
      </section>

      <div className="connection-page__actions">
        <button type="button" onClick={onRetry}>Thử lại</button>
        <button
          className="is-secondary"
          type="button"
          onClick={() => {
            onHome?.();
            router.push("/");
          }}
        >
          Về trang chủ
        </button>
      </div>
    </main>
  );
}
