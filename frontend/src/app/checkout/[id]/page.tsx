"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError, cancelOrder, getOrder } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/api.types";
import { clearAccessToken, getAccessToken, loginUrl } from "@/lib/auth-token";
import { formatCurrency } from "@/lib/format";

const AUTO_CANCEL_REASON = "Quá hạn thanh toán";
const PAYABLE_STATUSES: OrderStatus[] = ["PENDING", "PAYMENT_FAILED"];
// Scheduler hủy đơn mỗi phút, nên sau khi hết giờ cần tải lại vài lần.
const EXPIRED_REFRESH_MS = 15_000;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((count) => count + 1);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(loginUrl(`/checkout/${id}`));
      return;
    }

    const controller = new AbortController();
    async function loadOrder(accessToken: string) {
      try {
        setOrder(await getOrder(id, accessToken, controller.signal));
        setLoadError("");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          clearAccessToken();
          router.replace(loginUrl(`/checkout/${id}`));
          return;
        }
        setLoadError("Không tải được đơn hàng. Vui lòng thử lại.");
      }
    }

    void loadOrder(token);
    return () => controller.abort();
  }, [id, reloadCount, router]);

  const isPayable = order !== null && PAYABLE_STATUSES.includes(order.status);
  const expiresAt = order?.expiresAt ? new Date(order.expiresAt).getTime() : null;
  const secondsLeft = expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const isExpired = isPayable && secondsLeft === 0;

  useEffect(() => {
    if (!isPayable) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPayable]);

  useEffect(() => {
    if (!isExpired) return;
    const timer = setInterval(() => setReloadCount((count) => count + 1), EXPIRED_REFRESH_MS);
    return () => clearInterval(timer);
  }, [isExpired]);

  async function confirmCancel() {
    const token = getAccessToken();
    if (!token) {
      router.replace(loginUrl(`/checkout/${id}`));
      return;
    }
    setIsCancelling(true);
    setCancelError("");
    try {
      await cancelOrder(id, token);
      setShowCancelModal(false);
      reload();
    } catch (error: unknown) {
      setCancelError(error instanceof Error ? error.message : "Không thể hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#F8F5EC] flex flex-col items-center justify-center gap-4 p-6 text-center text-[#333]" role="alert">
        <p>{loadError}</p>
        <button
          className="bg-[#C28E5E] text-white text-[13px] font-bold px-4 py-2 rounded-lg"
          onClick={reload}
          type="button"
        >
          Thử lại
        </button>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#F8F5EC] flex items-center justify-center text-[#333]" aria-live="polite">
        Đang tải đơn hàng...
      </main>
    );
  }

  const isAutoCancelled =
    isExpired || (order.status === "CANCELLED" && order.cancelReason === AUTO_CANCEL_REASON);

  // ===== Màn "Đơn đã tự động hủy" (45) và "Đã hủy đơn" =====
  if (isAutoCancelled || order.status === "CANCELLED") {
    return (
      <main className="min-h-screen bg-[#F8F5EC] flex justify-center font-sans">
        <div className="w-full max-w-[400px] min-h-screen flex flex-col p-5">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#FCE8E6] rounded-full flex items-center justify-center mb-4" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D93025" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            </div>
            <h1 className="text-[19px] font-bold text-[#333] mb-2">
              {isAutoCancelled ? "Đơn đã tự động hủy" : `Đã hủy đơn ${order.code}`}
            </h1>
            <p className="text-[13px] text-[#888] leading-relaxed">
              {isAutoCancelled
                ? `Đơn ${order.code} quá 15 phút chưa thanh toán nên đã được hủy. Các món đã được hoàn lại kho và mã giảm giá (nếu có) đã được trả lại.`
                : order.cancelReason ?? "Đơn hàng đã được hủy."}
            </p>
          </div>
          <div className="space-y-2">
            <Link href="/" className="block w-full py-3.5 bg-[#C28E5E] text-white! font-bold rounded-xl text-center text-[14px]">
              Đặt lại món
            </Link>
            <Link href="/orders" className="block w-full py-3.5 border border-[#C28E5E] text-[#C28E5E]! font-bold rounded-xl text-center text-[14px]">
              Xem lịch sử đơn hàng
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentUrl = `/payment?orderId=${order.id}&amount=${order.total}&code=${order.code}`;

  // ===== Màn "Đơn hàng của bạn" (27, 31) =====
  return (
    <main className="min-h-screen bg-[#F8F5EC] flex justify-center font-sans pb-40">
      <div className="w-full max-w-[400px] min-h-screen relative">
        <header className="flex items-center px-5 pt-8 pb-4">
          <Link aria-label="Về giỏ hàng" href="/cart" className="mr-3 text-[#222]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-[19px] font-bold text-[#222]">Đơn hàng của bạn</h1>
        </header>

        <div className="px-4 space-y-4">
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-[#F0EAD6]">
            <div className="flex justify-between items-center">
              <p className="font-bold text-[#333] text-[15px]">Mã đơn {order.code}</p>
              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${isPayable ? "bg-[#FFF3D8] text-[#D4A34B]" : "bg-[#E6F4EA] text-[#1E8E3E]"}`}>
                {order.status === "PAYMENT_FAILED" ? "Thanh toán lỗi" : isPayable ? "Chờ thanh toán" : "Đã thanh toán"}
              </span>
            </div>
            <p className="text-[12px] text-[#888] mt-1">{itemCount} sản phẩm · Nhận tại quầy</p>
            {isPayable && secondsLeft !== null && (
              <p className="mt-3 text-center font-bold text-[#C28E5E] bg-[#FDF3D9] rounded-full py-2 text-[13px]" aria-live="polite">
                Thanh toán trong {formatCountdown(secondsLeft)} để giữ đơn
              </p>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-[#F0EAD6] overflow-hidden" aria-label="Các món trong đơn">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 p-4 border-b border-[#F5F0E1] last:border-0">
                {item.product?.imageUrl ? (
                  <Image src={item.product.imageUrl} alt={item.productName} width={60} height={60} className="w-[60px] h-[60px] rounded-xl object-cover" />
                ) : (
                  <div className="w-[60px] h-[60px] rounded-xl bg-[#F2E9D8]" aria-hidden="true" />
                )}
                <div className="flex-1 flex justify-between">
                  <div>
                    <p className="font-bold text-[#333] text-[14px]">{item.productName}</p>
                    <p className="text-[12px] text-[#888] mt-0.5">Size {item.size} · x{item.quantity}</p>
                  </div>
                  <p className="font-bold text-[#C28E5E] text-[14px]">{formatCurrency(item.lineTotal)}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white p-4 rounded-2xl shadow-sm border border-[#F0EAD6] text-[14px] space-y-2.5" aria-label="Tổng tiền">
            <div className="flex justify-between text-[#333]"><span>Tạm tính</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between text-[#333]"><span>Giảm giá</span><span>-{formatCurrency(order.discount)}</span></div>
            <div className="flex justify-between font-bold text-[#333] text-[16px] pt-2 border-t border-[#F5F0E1]"><span>Tổng cộng</span><span>{formatCurrency(order.total)}</span></div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto p-4 bg-[#F8F5EC] space-y-2">
          {isPayable ? (
            <>
              <Link href={paymentUrl} className="block w-full py-3.5 bg-[#C28E5E] text-white! font-bold rounded-xl text-center text-[14px]">
                Thanh toán {formatCurrency(order.total)}
              </Link>
              <button
                className="w-full py-3 text-[#D93025] font-bold text-[14px]"
                onClick={() => setShowCancelModal(true)}
                type="button"
              >
                Hủy đơn hàng
              </button>
            </>
          ) : (
            <Link href="/orders" className="block w-full py-3.5 bg-[#C28E5E] text-white! font-bold rounded-xl text-center text-[14px]">
              Xem lịch sử đơn hàng
            </Link>
          )}
        </div>

        {showCancelModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6" role="presentation">
            <div className="bg-white p-6 rounded-[24px] w-full max-w-[320px] text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="checkout-cancel-title">
              <h2 id="checkout-cancel-title" className="text-[18px] font-bold mb-2 text-[#333]">Hủy đơn hàng?</h2>
              <p className="mb-6 text-[13px] text-[#888]">Đơn {order.code} sẽ bị hủy và các món được trả lại kho.</p>
              {cancelError && <p className="mb-4 text-[13px] text-[#D93025]" role="alert">{cancelError}</p>}
              <div className="flex gap-3">
                <button className="flex-1 py-3 border border-[#C28E5E] text-[#333] rounded-xl font-bold text-[14px]" onClick={() => setShowCancelModal(false)} type="button">
                  Giữ đơn
                </button>
                <button
                  className="flex-1 py-3 bg-[#D93025] text-white rounded-xl font-bold text-[14px] disabled:opacity-60"
                  disabled={isCancelling}
                  onClick={() => void confirmCancel()}
                  type="button"
                >
                  {isCancelling ? "Đang hủy..." : "Hủy đơn"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
