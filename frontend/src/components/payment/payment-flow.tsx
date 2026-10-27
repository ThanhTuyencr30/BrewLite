"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenState, PaymentMethod, PaymentResponse } from "@/lib/api.types";
import { ApiError, confirmQrPayment, getMe, submitPayment } from "@/lib/api";
import { clearAccessToken, getAccessToken, loginUrl } from "@/lib/auth-token";
import MethodSelection from "@/components/payment/method-selection";
import CardForm from "@/components/payment/card-form";
import QRPayment from "@/components/payment/qr-payment";
import ProcessingState from "@/components/payment/processing-state";
import FailedState from "@/components/payment/failed-state";
import OrderSuccess from "@/components/payment/order-success";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  E_WALLET: "Ví điện tử",
  CARD: "Thẻ ngân hàng",
  QR: "Chuyển khoản QR",
};

interface PaymentFlowProps {
  orderId: string;
  orderCode?: string;
  amount: number;
}

export default function PaymentFlow({ orderId, orderCode, amount }: PaymentFlowProps) {
  // Mã hiển thị cho khách (CC-xxxxxx); orderId chỉ dùng để gọi API.
  const orderLabel = orderCode ?? orderId;
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>("SELECT_METHOD");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [paidAmount, setPaidAmount] = useState(amount);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [rewardPoints, setRewardPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState<number>();
  const [qrPayment, setQrPayment] = useState<PaymentResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const redirectToLogin = () =>
    router.push(
      loginUrl(`/payment?orderId=${orderId}&amount=${amount}${orderCode ? `&code=${orderCode}` : ""}`),
    );

  const showResult = (payment: PaymentResponse) => {
    setPaidAmount(payment.amount);

    if (payment.status === "SUCCEEDED") {
      setRewardPoints(payment.rewardPoints);
      setScreen("ORDER_SUCCESS");
      const token = getAccessToken();
      if (token) {
        getMe(token)
          .then((user) => setTotalPoints(user.loyaltyPoints))
          .catch(() => setTotalPoints(undefined));
      }
      return;
    }

    if (payment.status === "FAILED") {
      setErrorMessage(payment.failureReason ?? undefined);
      setScreen("FAILED");
      return;
    }

    if (payment.method === "QR" && payment.qrExpiresAt) {
      setQrPayment(payment);
      setScreen("QR_CODE");
    }
    // PENDING khác: giữ màn hình đang xử lý trong lúc chờ cổng thanh toán xác nhận.
  };

  const runPayment = async (request: (token: string) => Promise<PaymentResponse>) => {
    const token = getAccessToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    setIsBusy(true);
    setErrorMessage(undefined);
    try {
      showResult(await request(token));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        redirectToLogin();
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : undefined);
      setScreen("FAILED");
    } finally {
      setIsBusy(false);
    }
  };

  const handleProcessPayment = (selectedMethod: PaymentMethod, cardNumber?: string) => {
    // Mã QR hiện ngay trên màn QR, không cần màn "Đang xử lý".
    if (selectedMethod !== "QR") setScreen("PROCESSING");
    return runPayment((token) =>
      submitPayment({ orderId, method: selectedMethod, cardNumber }, token),
    );
  };

  const handleConfirmQr = () => {
    if (!qrPayment) return;
    return runPayment((token) => confirmQrPayment(qrPayment.id, token));
  };

  const handleRetry = () => {
    if (method === "CARD") setScreen("CARD_FORM");
    else if (method) void handleProcessPayment(method);
  };

  const goToOrder = () => router.push(`/checkout/${orderId}`);

  return (
    <main className="max-w-md mx-auto h-screen bg-[#F5EBE1] text-[#4a3b32] font-sans overflow-y-auto">
      {/* Màn 1: Chọn phương thức */}
      {screen === "SELECT_METHOD" && (
        <div className="p-4 h-full flex flex-col">
          <header className="flex items-center mb-6">
            <button
              aria-label="Quay lại"
              className="mr-4 text-xl font-bold"
              onClick={() => router.back()}
              type="button"
            >
              ←
            </button>
            <h1 className="text-lg font-bold">Thanh toán</h1>
          </header>

          <div className="bg-white rounded-xl p-4 text-center mb-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng thanh toán</p>
            <h2 className="text-2xl font-bold text-[#4a3b32] my-1">
              {paidAmount.toLocaleString("vi-VN")}đ
            </h2>
            <p className="text-xs text-gray-400">Mã đơn hàng: {orderLabel}</p>
          </div>

          <div className="flex-1">
            <MethodSelection
              amount={paidAmount}
              onSelect={(selected) => {
                setMethod(selected);
                if (selected === "CARD") setScreen("CARD_FORM");
                if (selected === "QR") void handleProcessPayment(selected);
                if (selected === "E_WALLET") void handleProcessPayment(selected);
              }}
            />
          </div>
        </div>
      )}

      {/* Màn 2: Form Thẻ ngân hàng */}
      {screen === "CARD_FORM" && (
        <div className="p-4 h-full">
          <CardForm
            amount={paidAmount}
            orderId={orderLabel}
            onBack={() => setScreen("SELECT_METHOD")}
            onSubmit={(cardNumber) => void handleProcessPayment("CARD", cardNumber)}
          />
        </div>
      )}

      {/* Màn 3: QR Code */}
      {screen === "QR_CODE" && qrPayment?.qrExpiresAt && (
        <div className="p-4 h-full">
          <QRPayment
            key={qrPayment.id}
            amount={paidAmount}
            orderId={orderLabel}
            expiresAt={qrPayment.qrExpiresAt}
            isBusy={isBusy}
            onBack={() => setScreen("SELECT_METHOD")}
            onCancel={goToOrder}
            onConfirm={() => void handleConfirmQr()}
            onRegenerate={() => void handleProcessPayment("QR")}
          />
        </div>
      )}

      {/* Màn 4: Đang xử lý */}
      {screen === "PROCESSING" && (
        <div className="p-4 h-full">
          <ProcessingState amount={paidAmount} orderId={orderLabel} />
        </div>
      )}

      {/* Màn 5: Thất bại */}
      {screen === "FAILED" && (
        <div className="p-4 h-full">
          <FailedState
            amount={paidAmount}
            orderId={orderLabel}
            errorMessage={errorMessage}
            onRetry={handleRetry}
            onChangeMethod={() => setScreen("SELECT_METHOD")}
            onCancel={goToOrder}
          />
        </div>
      )}

      {/* Màn 6: Thành công */}
      {screen === "ORDER_SUCCESS" && (
        <div className="h-full">
          <OrderSuccess
            orderId={orderLabel}
            amount={paidAmount}
            method={method ? METHOD_LABELS[method] : METHOD_LABELS.E_WALLET}
            points={rewardPoints}
            totalPoints={totalPoints}
            onTrackOrder={goToOrder}
            onGoHome={() => router.push("/")}
          />
        </div>
      )}
    </main>
  );
}
