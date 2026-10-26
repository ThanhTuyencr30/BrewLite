"use client";
import React from "react";

interface ProcessingStateProps {
  amount: number;
  orderId: string;
}

export default function ProcessingState({
  amount,
  orderId,
}: ProcessingStateProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header[cite: 8] */}
      <div className="flex items-center mb-6">
        <button className="mr-4 text-xl font-bold opacity-50 cursor-not-allowed">
          ←
        </button>
        <h2 className="text-lg font-bold text-[#4a3b32]">Thanh toán</h2>
      </div>

      <div className="bg-white rounded-xl p-4 text-center mb-6 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Tổng thanh toán</p>
        <h3 className="text-2xl font-bold text-[#4a3b32] my-1">
          {amount.toLocaleString("vi-VN")}đ
        </h3>
        <p className="text-xs text-gray-400">Mã đơn hàng: {orderId}</p>
      </div>

      {/* Box trạng thái[cite: 8] */}
      <div className="bg-white rounded-xl p-8 mb-4 shadow-sm border border-gray-100 text-center flex flex-col items-center">
        <h3 className="font-bold text-[#4a3b32] text-lg mb-6">
          Đang xử lý thanh toán
        </h3>
        <div className="w-24 h-24 bg-[#fcf8e3] rounded-full flex items-center justify-center mb-6">
          {/* Biểu tượng đồng hồ[cite: 8] */}
          <span className="text-5xl text-[#c08d60]">🕒</span>
        </div>
        <p className="text-sm text-gray-500">
          Vui lòng chờ hệ thống xác nhận thanh toán
        </p>
      </div>

      {/* Thông tin thêm[cite: 8] */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fcf8e3] rounded-lg flex items-center justify-center text-xl">
          🕒
        </div>
        <div>
          <p className="font-bold text-sm text-[#4a3b32]">
            Đang xử lý thanh toán
          </p>
          <p className="text-xs text-gray-500">
            Hệ thống đang kiểm tra giao dịch của bạn.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl text-gray-400">
          🛡
        </div>
        <div>
          <p className="font-bold text-sm text-[#4a3b32]">Thanh toán an toàn</p>
          <p className="text-xs text-gray-500">
            Vui lòng không chia sẻ thông tin giao dịch với người khác.
          </p>
        </div>
      </div>
    </div>
  );
}
