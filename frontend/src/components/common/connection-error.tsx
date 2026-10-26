"use client";

interface ConnectionErrorProps {
  onRetry: () => void;
}

export function ConnectionError({ onRetry }: ConnectionErrorProps) {
  return (
    <section className="connection-error" aria-labelledby="connection-title">
      <div className="connection-error__icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img">
          <path d="M13 36h33a9 9 0 0 0 0-18 14 14 0 0 0-26-5A12 12 0 0 0 13 36Z" />
          <path d="m24 45 16-16M23 29l17 16" />
        </svg>
      </div>
      <p className="eyebrow">Mất kết nối</p>
      <h2 id="connection-title">Không thể kết nối</h2>
      <p>
        BrewLite chưa lấy được menu. Hãy kiểm tra backend hoặc kết nối mạng rồi
        thử lại nhé.
      </p>
      <button className="primary-button" type="button" onClick={onRetry}>
        Thử lại
      </button>
    </section>
  );
}
