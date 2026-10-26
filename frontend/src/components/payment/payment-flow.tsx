"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenState, PaymentMethod } from "@/lib/api.types";
import { submitPayment } from "@/lib/api";
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
  amount: number;
}

export default function PaymentFlow({ orderId, amount }: PaymentFlowProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>("SELECT_METHOD");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [paidAmount, setPaidAmount] = useState(amount);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleProcessPayment = async (selectedMethod: PaymentMethod) => {
    setScreen("PROCESSING");
    setErrorMessage(undefined);

    try {
      const payment = await submitPayment({ orderId, method: selectedMethod });
      setPaidAmount(payment.amount);

      if (payment.status === "SUCCEEDED") {
        setScreen("ORDER_SUCCESS");
        return;
      }

      if (payment.status === "FAILED") {
        setErrorMessage(payment.failureReason ?? undefined);
        setScreen("FAILED");
      }
      // PENDING: giữ màn hình đang xử lý trong lúc chờ cổng thanh toán xác nhận.
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : undefined);
      setScreen("FAILED");
    }
  };

  const goToOrder = () => router.push(`/orders/${orderId}`);

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
            <p className="text-xs text-gray-400">Mã đơn hàng: {orderId}</p>
          </div>

          <div className="flex-1">
            <MethodSelection
              onSelect={(selected) => {
                setMethod(selected);
                if (selected === "CARD") setScreen("CARD_FORM");
                if (selected === "QR") setScreen("QR_CODE");
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
            orderId={orderId}
            onBack={() => setScreen("SELECT_METHOD")}
            onSubmit={() => void handleProcessPayment("CARD")}
          />
        </div>
      )}

      {/* Màn 3: QR Code */}
      {screen === "QR_CODE" && (
        <div className="p-4 h-full">
          <QRPayment
            amount={paidAmount}
            orderId={orderId}
            onBack={() => setScreen("SELECT_METHOD")}
            onCancel={goToOrder}
          />
        </div>
      )}

      {/* Màn 4: Đang xử lý */}
      {screen === "PROCESSING" && (
        <div className="p-4 h-full">
          <ProcessingState amount={paidAmount} orderId={orderId} />
        </div>
      )}

      {/* Màn 5: Thất bại */}
      {screen === "FAILED" && (
        <div className="p-4 h-full">
          <FailedState
            amount={paidAmount}
            orderId={orderId}
            errorMessage={errorMessage}
            onRetry={() => method && void handleProcessPayment(method)}
            onChangeMethod={() => setScreen("SELECT_METHOD")}
            onCancel={goToOrder}
          />
        </div>
      )}

      {/* Màn 6: Thành công */}
      {screen === "ORDER_SUCCESS" && (
        <div className="h-full">
          <OrderSuccess
            orderId={orderId}
            amount={paidAmount}
            method={method ? METHOD_LABELS[method] : METHOD_LABELS.E_WALLET}
            points={Math.floor(paidAmount / 10000)} // 1 điểm / 10.000đ
            onTrackOrder={goToOrder}
            onGoHome={() => router.push("/")}
          />
        </div>
      )}
    </main>
  );
}
