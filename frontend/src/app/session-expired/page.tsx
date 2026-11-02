import Link from "next/link";
import styles from "@/components/auth/auth.module.css";

export default function SessionExpiredPage() {
  return (
    <main className={styles.authPage}>
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

        <section className={styles.expiredCard} aria-labelledby="expired-title">
          <span className={styles.expiredIcon} aria-hidden="true">⌛</span>
          <span className={styles.authKicker}>Một chút gián đoạn</span>
          <h1 id="expired-title">Phiên đăng nhập đã hết hạn</h1>
          <p>
            Vui lòng đăng nhập lại để tiếp tục. Giỏ hàng và đơn hàng đang thanh
            toán của bạn vẫn được giữ nguyên.
          </p>
          <Link className={styles.expiredPrimary} href="/login">
            Đăng nhập lại <span aria-hidden="true">→</span>
          </Link>
          <Link className={styles.expiredSecondary} href="/">
            Về trang chủ
          </Link>
        </section>
        <p className={styles.authLegal}>BREWLITE · Hẹn gặp lại bạn nhé</p>
      </div>
    </main>
  );
}
