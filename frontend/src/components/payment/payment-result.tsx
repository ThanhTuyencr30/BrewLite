"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getMe, getPayment } from "@/lib/api";
import type { PaymentDetails } from "@/lib/api.types";
import { clearAccessToken, getAccessToken, loginUrl } from "@/lib/auth-token";
import FailedState from "@/components/payment/failed-state";
import OrderSuccess from "@/components/payment/order-success";

interface PaymentResultProps {
  paymentId?: string;
  hasError: boolean;
}

const METHOD_LABELS: Record<PaymentDetails["method"], string> = {
  WALLET: "Ví điện tử",
  CARD: "Thẻ ngân hàng",
  QR: "Chuyển khoản QR",
  VNPAY: "VNPay",
};

// Trang VNPay đưa khách quay về sau khi thanh toán. Kết quả lấy từ backend,
// nơi đã kiểm tra chữ ký VNPay và cập nhật đơn hàng.
export default function PaymentResult({ paymentId, hasError }: PaymentResultProps) {
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [totalPoints, setTotalPoints] = useState<number>();
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (hasError || !paymentId) return;

    const token = getAccessToken();
    if (!token) {
      router.replace(loginUrl(`/payment/result?paymentId=${paymentId}`));
      return;
    }

    const controller = new AbortController();
    async function load(accessToken: string, id: string) {
      try {
        const result = await getPayment(id, accessToken, controller.signal);
        setPayment(result);
        setLoadError("");
        if (result.status === "SUCCEEDED") {
          getMe(accessToken)
            .then((user) => setTotalPoints(user.loyaltyPoints))
            .catch(() => setTotalPoints(undefined));
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          clearAccessToken();
          router.replace(loginUrl(`/payment/result?paymentId=${id}`));
          return;
        }
        setLoadError("Không tải được kết quả thanh toán. Vui lòng thử lại.");
      }
    }

    void load(token, paymentId);
    return () => controller.abort();
  }, [paymentId, hasError, reloadCount, router]);

  const shell = (children: React.ReactNode) => (
    <main className="max-w-md mx-auto h-screen bg-[#F5EBE1] text-[#4a3b32] font-sans overflow-y-auto">
      {children}
    </main>
  );

  if (hasError || !paymentId) {
    return shell(
      <div className="p-6 h-full flex flex-col items-center justify-center text-center gap-4" role="alert">
        <h1 className="text-lg font-bold">Không xác minh được kết quả thanh toán</h1>
        <p className="text-sm text-gray-500">
          Kết quả từ VNPay không hợp lệ. Nếu bạn đã bị trừ tiền, hãy kiểm tra
          lịch sử đơn hàng hoặc liên hệ quầy.
        </p>
        <button
          className="px-6 py-3 rounded-xl bg-[#c08d60] text-white font-bold"
          onClick={() => router.push("/orders")}
          type="button"
        >
          Xem lịch sử đơn hàng
        </button>
      </div>,
    );
  }

  if (loadError) {
    return shell(
      <div className="p-6 h-full flex flex-col items-center justify-center text-center gap-4" role="alert">
        <p>{loadError}</p>
        <button
          className="px-6 py-3 rounded-xl bg-[#c08d60] text-white font-bold"
          onClick={() => setReloadCount((count) => count + 1)}
          type="button"
        >
          Thử lại
        </button>
      </div>,
    );
  }

  if (!payment) {
    return shell(
      <div className="p-6 h-full flex items-center justify-center" aria-live="polite">
        Đang lấy kết quả thanh toán...
      </div>,
    );
  }

  const retryUrl = `/payment?orderId=${payment.orderId}&amount=${payment.amount}&code=${payment.orderCode}`;

  if (payment.status === "SUCCEEDED") {
    return shell(
      <OrderSuccess
        orderId={payment.orderCode}
        amount={payment.amount}
        method={METHOD_LABELS[payment.method]}
        points={payment.rewardPoints}
        totalPoints={totalPoints}
        onTrackOrder={() => router.push(`/checkout/${payment.orderId}`)}
        onGoHome={() => router.push("/")}
      />,
    );
  }

  if (payment.status === "PENDING") {
    return shell(
      <div className="p-6 h-full flex flex-col items-center justify-center text-center gap-4" aria-live="polite">
        <h1 className="text-lg font-bold">Đang chờ VNPay xác nhận</h1>
        <p className="text-sm text-gray-500">Giao dịch của đơn {payment.orderCode} chưa có kết quả cuối cùng.</p>
        <button
          className="px-6 py-3 rounded-xl bg-[#c08d60] text-white font-bold"
          onClick={() => setReloadCount((count) => count + 1)}
          type="button"
        >
          Kiểm tra lại
        </button>
      </div>,
    );
  }

  return shell(
    <div className="p-4 h-full">
      <FailedState
        amount={payment.amount}
        orderId={payment.orderCode}
        errorMessage={payment.failureReason ?? undefined}
        onRetry={() => router.push(retryUrl)}
        onChangeMethod={() => router.push(retryUrl)}
        onCancel={() => router.push(`/checkout/${payment.orderId}`)}
      />
    </div>,
  );
}
