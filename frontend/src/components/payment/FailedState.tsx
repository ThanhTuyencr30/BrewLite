"use client";
import React from "react";

interface FailedStateProps {
  amount: number;
  orderId: string;
  errorMessage?: string;
  onRetry: () => void;
  onChangeMethod: () => void;
  onCancel: () => void;
}

export default function FailedState({
  amount,
  orderId,
  errorMessage,
  onRetry,
  onChangeMethod,
  onCancel,
}: FailedStateProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-6">
        <button onClick={onChangeMethod} className="mr-4 text-xl font-bold">
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

      {/* Box thông báo lỗi[cite: 7, 10] */}
      <div className="bg-white rounded-xl p-8 mb-4 shadow-sm border border-gray-100 text-center flex flex-col items-center">
        <h3 className="font-bold text-[#4a3b32] text-lg mb-6">
          Thanh toán thất bại!
        </h3>
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100 mb-6">
          <span className="text-5xl text-red-500">❌</span>
        </div>
        <p className="text-sm text-gray-500">
          {errorMessage ||
            "Giao dịch chưa thành công. Giỏ hàng của bạn vẫn được giữ nguyên."}
        </p>
      </div>

      {/* Các nút hành động[cite: 7] */}
      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={onRetry}
          className="w-full bg-[#c08d60] text-white py-3 rounded-xl font-bold"
        >
          Thử lại
        </button>
        <button
          onClick={onChangeMethod}
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
