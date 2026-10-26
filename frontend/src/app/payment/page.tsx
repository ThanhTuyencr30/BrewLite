"use client";
import { useState } from "react";
import { ScreenState, PaymentMethod } from "@/lib/api.types";
import { submitPayment } from "@/lib/api";
import MethodSelection from "@/components/payment/MethodSelection";
import CardForm from "@/components/payment/CardForm";
import QRPayment from "@/components/payment/QRPayment";
import ProcessingState from "@/components/payment/ProcessingState";
import FailedState from "@/components/payment/FailedState";
import OrderSuccess from "@/components/payment/OrderSuccess";

export default function PaymentPage() {
  const [screen, setScreen] = useState<ScreenState>("SELECT_METHOD");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [rewardPoints, setRewardPoints] = useState<number>(0);

  const amount = 119000;
  const orderId = "CC-000004";

  // Hàm gọi API thực tế
  const handleProcessPayment = async (cardNumber?: string) => {
    setScreen("PROCESSING"); // Chuyển sang màn hình chờ[cite: 8]

    try {
      const result = await submitPayment({
        method: method || "CARD",
        amount: amount,
        cardNumber: cardNumber,
      });

      if (result.status === "PAID") {
        setRewardPoints(result.rewardPoints || Math.floor(amount / 10000)); // 1 điểm / 10.000đ[cite: 1]
        setScreen("ORDER_SUCCESS"); // Chuyển sang màn hình thành công[cite: 9]
      } else {
        setScreen("FAILED"); // Giao dịch từ chối[cite: 7, 10]
      }
    } catch (error) {
      console.error(error);
      setScreen("FAILED"); // Lỗi mạng hoặc server
    }
  };

  return (
    <main className="max-w-md mx-auto h-screen bg-[#F5EBE1] text-[#4a3b32] font-sans overflow-y-auto">
      {/* Màn 1: Chọn phương thức[cite: 3] */}
      {screen === "SELECT_METHOD" && (
        <div className="p-4 h-full flex flex-col">
          <header className="flex items-center mb-6">
            <button className="mr-4 text-xl font-bold">←</button>
            <h1 className="text-lg font-bold">Thanh toán</h1>
          </header>

          <div className="bg-white rounded-xl p-4 text-center mb-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng thanh toán</p>
            <h2 className="text-2xl font-bold text-[#4a3b32] my-1">
              {amount.toLocaleString("vi-VN")}đ
            </h2>
            <p className="text-xs text-gray-400">Mã đơn hàng: {orderId}</p>
          </div>

          <div className="flex-1">
            <MethodSelection
              onSelect={(selected) => {
                setMethod(selected);
                if (selected === "CARD") setScreen("CARD_FORM");
                if (selected === "QR") setScreen("QR_CODE");
                // Giả lập Ví điện tử gọi thanh toán ngay
                if (selected === "E_WALLET") handleProcessPayment();
              }}
            />
          </div>
        </div>
      )}

      {/* Màn 2: Form Thẻ ngân hàng[cite: 4] */}
      {screen === "CARD_FORM" && (
        <div className="p-4 h-full">
          <CardForm
            amount={amount}
            orderId={orderId}
            onBack={() => setScreen("SELECT_METHOD")}
            onSubmit={(cardNumber) => handleProcessPayment(cardNumber)}
          />
        </div>
      )}

      {/* Màn 3: QR Code[cite: 5, 6] */}
      {screen === "QR_CODE" && (
        <div className="p-4 h-full">
          <QRPayment
            amount={amount}
            orderId={orderId}
            onBack={() => setScreen("SELECT_METHOD")}
            onCancel={() => alert("Đã hủy đơn hàng")}
          />
        </div>
      )}

      {/* Màn 4: Đang xử lý[cite: 8] */}
      {screen === "PROCESSING" && (
        <div className="p-4 h-full">
          <ProcessingState amount={amount} orderId={orderId} />
        </div>
      )}

      {/* Màn 5: Thất bại[cite: 7, 10] */}
      {screen === "FAILED" && (
        <div className="p-4 h-full">
          <FailedState
            amount={amount}
            orderId={orderId}
            onRetry={() => handleProcessPayment()}
            onChangeMethod={() => setScreen("SELECT_METHOD")}
            onCancel={() => alert("Đã hủy đơn hàng")}
          />
        </div>
      )}

      {/* Màn 6: Thành công[cite: 9] */}
      {screen === "ORDER_SUCCESS" && (
        <div className="h-full">
          <OrderSuccess
            orderId={orderId}
            amount={amount}
            method={
              method === "CARD"
                ? "Thẻ ngân hàng"
                : method === "QR"
                ? "Chuyển khoản QR"
                : "Ví điện tử"
            }
            points={rewardPoints}
            onTrackOrder={() => alert("Theo dõi đơn hàng")}
            onGoHome={() => alert("Về trang chủ")}
          />
        </div>
      )}
    </main>
  );
}
