"use client";
import { useState, useEffect } from "react";

interface QRPaymentProps {
  amount: number;
  orderId: string;
  expiresAt: string;
  isBusy: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onRegenerate: () => void;
}

export default function QRPayment({
  amount,
  orderId,
  expiresAt,
  isBusy,
  onBack,
  onCancel,
  onConfirm,
  onRegenerate,
}: QRPaymentProps) {
  // Đếm ngược theo thời điểm hết hạn do server trả về (15 phút).
  const [now, setNow] = useState(() => Date.now());
  const timeLeft = Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000));
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (isExpired) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  // Format thời gian thành MM:SS
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-xl font-bold">
          ←
        </button>
        <h2 className="text-lg font-bold text-[#4a3b32]">Thanh toán</h2>
      </div>

      {/* Box Tổng thanh toán */}
      <div className="bg-white rounded-xl p-4 text-center mb-6 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Tổng thanh toán</p>
        <h3 className="text-2xl font-bold text-[#4a3b32] my-1">
          {amount.toLocaleString("vi-VN")}đ
        </h3>
        <p className="text-xs text-gray-400">Mã đơn hàng: {orderId}</p>
      </div>

      {/* Phương thức đã chọn */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#f6f5f0] rounded flex items-center justify-center text-[#c08d60]">
          QR
        </div>
        <div>
          <p className="font-bold text-sm text-[#4a3b32]">Chuyển khoản QR</p>
          <p className="text-xs text-gray-500">
            Quét mã bằng ứng dụng ngân hàng
          </p>
        </div>
      </div>

      {/* Box QR Code */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-100 text-center flex flex-col items-center">
        {!isExpired ? (
          <>
            <h3 className="font-bold text-[#4a3b32] mb-4">
              Quét mã để thanh toán
            </h3>
            {/* Ảnh QR giả lập */}
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg mb-4">
              <span className="text-gray-400 text-4xl">🔳</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã QR.
            </p>
            <div className="mt-4 font-bold text-[#c08d60] bg-[#fcf8e3] px-4 py-2 rounded-full" aria-live="polite">
              Hết hạn sau: {minutes}:{seconds}
            </div>
            <button
              onClick={onConfirm}
              disabled={isBusy}
              className="mt-4 w-full bg-[#c08d60] text-white py-3 rounded-xl font-bold disabled:opacity-60"
              type="button"
            >
              {isBusy ? "Đang kiểm tra..." : "Tôi đã chuyển khoản"}
            </button>
          </>
        ) : (
          <>
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-lg mb-4 opacity-50">
              <span className="text-gray-400 text-4xl">🔳</span>
            </div>
            <h3 className="font-bold text-red-500 mb-2">Mã QR đã hết hạn</h3>
            <p className="text-xs text-gray-500 mb-6">
              Mã chỉ có hiệu lực 15 phút. Đơn {orderId} vẫn được giữ, bạn có thể
              tạo mã mới để thanh toán.
            </p>
            <button
              onClick={onRegenerate}
              disabled={isBusy}
              className="w-full bg-[#c08d60] text-white py-3 rounded-xl font-bold disabled:opacity-60"
              type="button"
            >
              Tạo mã QR mới
            </button>
          </>
        )}
      </div>

      {/* Các nút hành động dưới cùng */}
      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={onBack}
          className="w-full bg-white border border-[#c08d60] text-[#c08d60] py-3 rounded-xl font-bold"
        >
          Đổi phương thức
        </button>
        <button
          onClick={onCancel}
          className="w-full text-red-500 py-3 font-bold text-sm"
        >
          Hủy đơn hàng
        </button>
      </div>
    </div>
  );
}
