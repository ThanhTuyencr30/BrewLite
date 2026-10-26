"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthResultDialog } from "@/components/auth/auth-result-dialog";
import { ApiError, getMe } from "@/lib/api";
import type { User } from "@/lib/api.types";
import styles from "./profile.module.css";

const ACCESS_TOKEN_KEY = "accessToken";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<"logout" | "orders" | "promotions" | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadAccount(accessToken: string) {
      try {
        const account = await getMe(accessToken, controller.signal);
        setUser(account);
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          window.localStorage.removeItem(ACCESS_TOKEN_KEY);
          router.replace("/session-expired");
          return;
        }

        setLoadError("Không thể tải thông tin tài khoản. Vui lòng thử lại.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAccount(token);
    return () => controller.abort();
  }, [router]);

  function confirmLogout() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main aria-busy="true" className={styles.accountPage}>
        <div className={styles.accountShell}>
          <div className={styles.loadingBar} />
          <div className={styles.loadingCard} />
          <div className={styles.loadingCard} />
        </div>
      </main>
    );
  }

  if (loadError || !user) {
    return (
      <main className={styles.accountPage}>
        <section className={styles.accountError} role="alert">
          <span aria-hidden="true">☕</span>
          <h1>Chưa thể mở tài khoản</h1>
          <p>{loadError || "Vui lòng đăng nhập để xem thông tin tài khoản."}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
            type="button"
          >
            Thử lại
          </button>
          <Link className={styles.homeLink} href="/">
            Về trang chủ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.accountPage}>
      <div className={styles.accountShell}>
        <header className={styles.accountHeader}>
          <Link aria-label="Về trang chủ" className={styles.backLink} href="/">
            <span aria-hidden="true">←</span>
          </Link>
          <h1>Tài khoản</h1>
          <span className={styles.headerSpacer} aria-hidden="true" />
        </header>

        <section className={styles.memberCard} aria-label="Thông tin thành viên">
          <span className={styles.avatar} aria-hidden="true">
            {(user.fullName || user.email).slice(0, 1).toLocaleUpperCase("vi-VN")}
          </span>
          <span className={styles.memberDetails}>
            <strong>{user.fullName || user.email}</strong>
            {user.fullName && <span>{user.email}</span>}
            <span className={styles.memberBadge}>Thành viên COLDEN COFFEE</span>
          </span>
          <span aria-hidden="true" className={styles.memberSparkle}>✦</span>
        </section>

        <section className={styles.pointsCard} aria-label="Điểm thưởng">
          <div className={styles.pointsLabel}>
            <span aria-hidden="true" className={styles.pointsIcon}>✧</span>
            <span>Điểm thưởng</span>
          </div>
          <strong className={styles.pointsValue}>
            {user.loyaltyPoints.toLocaleString("vi-VN")}
            <span> điểm</span>
          </strong>
          <div className={styles.pointsDivider} />
          <p>Tích 1 điểm cho mỗi 10.000đ chi tiêu</p>
          <span className={styles.pointsDecor} aria-hidden="true">✳</span>
        </section>

        <section className={styles.accountActions} aria-label="Tiện ích tài khoản">
          <button
            className={styles.accountAction}
            onClick={() => setDialog("orders")}
            type="button"
          >
            <span className={styles.actionIcon} aria-hidden="true">▤</span>
            <span>Lịch sử đơn hàng</span>
            <span className={styles.actionArrow} aria-hidden="true">›</span>
          </button>
          <button
            className={styles.accountAction}
            onClick={() => setDialog("promotions")}
            type="button"
          >
            <span className={styles.actionIcon} aria-hidden="true">◇</span>
            <span>Mã giảm giá của tôi</span>
            <span className={styles.actionArrow} aria-hidden="true">›</span>
          </button>
        </section>

        <button
          className={styles.logoutButton}
          onClick={() => setDialog("logout")}
          type="button"
        >
          <span aria-hidden="true">↪</span>
          Đăng xuất
        </button>
        <p className={styles.accountFooter}>COLDEN COFFEE · Một chút yêu thương</p>
      </div>

      {dialog === "logout" && (
        <AuthResultDialog
          message="Bạn sẽ cần đăng nhập lại để tiếp tục đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên."
          onPrimary={confirmLogout}
          onSecondary={() => setDialog(null)}
          primaryLabel="Đăng xuất"
          secondaryLabel="Ở lại"
          title="Bạn muốn đăng xuất?"
          tone="warning"
        />
      )}
      {(dialog === "orders" || dialog === "promotions") && (
        <AuthResultDialog
          message="Tính năng này sẽ sớm có mặt. Cảm ơn bạn đã chờ đợi nhé!"
          onPrimary={() => setDialog(null)}
          primaryLabel="Đã hiểu"
          title={
            dialog === "orders"
              ? "Lịch sử đơn hàng"
              : "Mã giảm giá của tôi"
          }
          tone="info"
        />
      )}
    </main>
  );
}
