"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthResultDialog } from "@/components/auth/auth-result-dialog";
import { ApiError, getMe, getPromotions } from "@/lib/api";
import type { Promotion, User } from "@/lib/api.types";
import { formatCurrency } from "@/lib/format";
import styles from "./profile.module.css";

const ACCESS_TOKEN_KEY = "accessToken";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionError, setPromotionError] = useState("");
  const [promotionState, setPromotionState] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [promotionRetry, setPromotionRetry] = useState(0);
  const promotionDialog = useRef<HTMLElement>(null);
  const promotionCloseButton = useRef<HTMLButtonElement>(null);
  const [dialog, setDialog] = useState<"logout" | "promotions" | null>(
    null,
  );

  useEffect(() => {
    if (dialog !== "promotions") {
      return;
    }

    const controller = new AbortController();
    setPromotionState("loading");
    setPromotionError("");
    void getPromotions(controller.signal)
      .then((result) => {
        setPromotions(result);
        setPromotionState("loaded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setPromotionState("error");
        setPromotionError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách mã giảm giá.",
        );
      });

    return () => controller.abort();
  }, [dialog, promotionRetry]);

  useEffect(() => {
    if (dialog !== "promotions") {
      return;
    }

    promotionCloseButton.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialog(null);
        return;
      }

      if (event.key === "Tab") {
        const focusable = promotionDialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled])',
        );
        if (!focusable?.length) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

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
            <span className={styles.memberBadge}>Thành viên BREWLITE</span>
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
            onClick={() => router.push("/orders")}
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
        <p className={styles.accountFooter}>BREWLITE · Một chút yêu thương</p>
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
      {dialog === "promotions" && (
        <div
          className={styles.promotionBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDialog(null);
            }
          }}
        >
          <section
            aria-describedby="profile-promotions-description"
            aria-labelledby="profile-promotions-title"
            aria-modal="true"
            className={styles.promotionDialog}
            ref={promotionDialog}
            role="dialog"
          >
            <button
              aria-label="Đóng danh sách mã giảm giá"
              className={styles.promotionClose}
              onClick={() => setDialog(null)}
              ref={promotionCloseButton}
              type="button"
            >
              ×
            </button>
            <span className={styles.promotionDialogIcon} aria-hidden="true">
              %
            </span>
            <h2 id="profile-promotions-title">Mã giảm giá của tôi</h2>
            <p
              className={styles.promotionDialogIntro}
              id="profile-promotions-description"
            >
              Các mã ưu đãi hiện có tại BrewLite.
            </p>
            <div aria-live="polite" className={styles.promotionList}>
              {promotionState === "idle" || promotionState === "loading" ? (
                <p className={styles.promotionMessage} role="status">
                  Đang tải danh sách mã giảm giá...
                </p>
              ) : promotionState === "error" ? (
                <div className={styles.promotionMessage} role="alert">
                  <p>
                    {promotionError || "Không thể tải danh sách mã giảm giá."}
                  </p>
                  <button
                    className={styles.promotionRetry}
                    onClick={() => setPromotionRetry((retry) => retry + 1)}
                    type="button"
                  >
                    Thử lại
                  </button>
                </div>
              ) : promotions.length === 0 ? (
                <p className={styles.promotionMessage}>
                  Hiện chưa có mã giảm giá nào.
                </p>
              ) : (
                promotions.map((promotion) => (
                  <article
                    className={styles.promotionCard}
                    key={promotion.id}
                  >
                    <div className={styles.promotionCardHeading}>
                      <strong>{promotion.code}</strong>
                      <span
                        className={
                          promotion.isAvailable
                            ? styles.promotionAvailable
                            : styles.promotionUnavailable
                        }
                      >
                        {promotion.isAvailable
                          ? "Đang áp dụng"
                          : "Chưa khả dụng"}
                      </span>
                    </div>
                    <p className={styles.promotionDiscount}>
                      {promotion.discountType === "PERCENT"
                        ? `Giảm ${promotion.value}%${
                            promotion.maxDiscount !== null
                              ? `, tối đa ${formatCurrency(promotion.maxDiscount)}`
                              : ""
                          }`
                        : `Giảm ${formatCurrency(promotion.value)}`}
                    </p>
                    {promotion.description && (
                      <p className={styles.promotionDescription}>
                        {promotion.description}
                      </p>
                    )}
                    <p className={styles.promotionTerms}>
                      Đơn tối thiểu {formatCurrency(promotion.minOrderValue)}
                    </p>
                    <p className={styles.promotionExpiry}>
                      {promotion.isAvailable
                        ? `Hạn sử dụng: ${new Date(promotion.endsAt).toLocaleDateString("vi-VN")}`
                        : promotion.availabilityMessage}
                    </p>
                  </article>
                ))
              )}
            </div>
            <button
              className={styles.promotionDone}
              onClick={() => setDialog(null)}
              type="button"
            >
              Đã hiểu
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
