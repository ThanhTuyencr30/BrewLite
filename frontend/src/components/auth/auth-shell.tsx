import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./auth.module.css";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className={styles.authPage}>
      <div className={styles.authGlow} aria-hidden="true" />
      <div className={styles.authFrame}>
        <Link className={styles.logo} href="/" aria-label="BrewLite - Trang chủ">
          <span className={styles.logoMark} aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M10 17h20v9a10 10 0 0 1-20 0v-9Z" />
              <path d="M30 19h2a5 5 0 0 1 0 10h-4M15 11c-2-2 2-3 0-5M22 11c-2-2 2-3 0-5" />
            </svg>
          </span>
          <span className={styles.logoText}>
            <strong>BREWLITE</strong>
            <small>Một chút cà phê, một chút yêu thương.</small>
          </span>
        </Link>

        <section className={styles.authCard} aria-labelledby="auth-title">
          <div className={styles.authHeading}>
            <span className={styles.authKicker}>Rất vui khi gặp bạn</span>
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
          <div className={styles.authFooter}>{footer}</div>
        </section>

        <p className={styles.authLegal}>© 2026 BrewLite · Pha bằng sự tử tế</p>
      </div>
    </main>
  );
}
