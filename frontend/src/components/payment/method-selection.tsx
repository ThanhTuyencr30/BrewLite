"use client";
import { useState } from "react";
import { PaymentMethod } from "@/lib/api.types";

interface MethodSelectionProps {
  amount: number;
  onSelect: (method: PaymentMethod) => void;
}

export default function MethodSelection({ amount, onSelect }: MethodSelectionProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm font-bold text-[#4a3b32] mb-4">
        Chọn phương thức thanh toán
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {/* VNPay: cổng thanh toán bên thứ ba xác nhận kết quả */}
        <button
          onClick={() => setSelected("VNPAY")}
          className={`flex items-center justify-between p-4 bg-white rounded-xl border-2 transition-all ${
            selected === "VNPAY" ? "border-[#c08d60]" : "border-transparent"
          }`}
          type="button"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fcf8e3] rounded-lg flex items-center justify-center text-sm font-bold text-[#c08d60]">
              VN
            </div>
            <div className="text-left">
              <p className="font-bold text-[#4a3b32] text-sm">VNPay</p>
              <p className="text-xs text-gray-500">
                Thẻ, QR và ngân hàng nội địa qua cổng VNPay
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === "VNPAY" ? "border-[#c08d60]" : "border-gray-300"
            }`}
          >
            {selected === "VNPAY" && (
              <div className="w-2.5 h-2.5 bg-[#c08d60] rounded-full" />
            )}
          </div>
        </button>

        {/* Ví điện tử */}
        <button
          onClick={() => setSelected("E_WALLET")}
          className={`flex items-center justify-between p-4 bg-white rounded-xl border-2 transition-all ${
            selected === "E_WALLET" ? "border-[#c08d60]" : "border-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fcf8e3] rounded-lg flex items-center justify-center text-xl">
              👛
            </div>
            <div className="text-left">
              <p className="font-bold text-[#4a3b32] text-sm">Ví điện tử</p>
              <p className="text-xs text-gray-500">Giả lập, không qua cổng thật</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === "E_WALLET" ? "border-[#c08d60]" : "border-gray-300"
            }`}
          >
            {selected === "E_WALLET" && (
              <div className="w-2.5 h-2.5 bg-[#c08d60] rounded-full" />
            )}
          </div>
        </button>

        {/* Thẻ ngân hàng */}
        <button
          onClick={() => setSelected("CARD")}
          className={`flex items-center justify-between p-4 bg-white rounded-xl border-2 transition-all ${
            selected === "CARD" ? "border-[#c08d60]" : "border-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fcf8e3] rounded-lg flex items-center justify-center text-xl">
              💳
            </div>
            <div className="text-left">
              <p className="font-bold text-[#4a3b32] text-sm">Thẻ ngân hàng</p>
              <p className="text-xs text-gray-500">
                Visa, Mastercard, thẻ nội địa
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === "CARD" ? "border-[#c08d60]" : "border-gray-300"
            }`}
          >
            {selected === "CARD" && (
              <div className="w-2.5 h-2.5 bg-[#c08d60] rounded-full" />
            )}
          </div>
        </button>

        {/* Chuyển khoản QR */}
        <button
          onClick={() => setSelected("QR")}
          className={`flex items-center justify-between p-4 bg-white rounded-xl border-2 transition-all ${
            selected === "QR" ? "border-[#c08d60]" : "border-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fcf8e3] rounded-lg flex items-center justify-center text-xl">
              📱
            </div>
            <div className="text-left">
              <p className="font-bold text-[#4a3b32] text-sm">
                Chuyển khoản QR
              </p>
              <p className="text-xs text-gray-500">
                Quét mã bằng ứng dụng ngân hàng
              </p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === "QR" ? "border-[#c08d60]" : "border-gray-300"
            }`}
          >
            {selected === "QR" && (
              <div className="w-2.5 h-2.5 bg-[#c08d60] rounded-full" />
            )}
          </div>
        </button>
      </div>

      {/* Ghi chú bảo mật */}
      <div className="flex items-center gap-2 mb-8 text-gray-500">
        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-400 text-xs">
          🛡
        </span>
        <p className="text-xs">
          BREWLITE chỉ hỗ trợ thanh toán không tiền mặt
        </p>
      </div>

      {/* Nút xác nhận */}
      <div className="mt-auto pt-4">
        <button
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
          className="w-full bg-[#c08d60] text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Xác nhận thanh toán - {amount.toLocaleString("vi-VN")}đ
        </button>
      </div>
    </div>
  );
}
