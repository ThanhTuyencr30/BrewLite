"use client";
import { useState, type FormEvent } from "react";

interface CardFormProps {
  amount: number;
  orderId: string;
  onBack: () => void;
  onSubmit: (cardNumber: string) => void;
}

export default function CardForm({
  amount,
  orderId,
  onBack,
  onSubmit,
}: CardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [errors, setErrors] = useState({
    cardNumber: false,
    expiry: false,
    cvv: false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Xóa khoảng trắng để kiểm tra regex
    const cleanCardNumber = cardNumber.replace(/\s/g, "");

    const isCardValid = /^\d{16}$/.test(cleanCardNumber); // Yêu cầu 16 chữ số
    const isCvvValid = /^\d{3}$/.test(cvv); // Yêu cầu 3 chữ số
    const isExpiryValid = expiry.trim().length >= 5; // Giả lập check ngày hết hạn

    setErrors({
      cardNumber: !isCardValid,
      expiry: !isExpiryValid,
      cvv: !isCvvValid,
    });

    if (isCardValid && isCvvValid && isExpiryValid) {
      onSubmit(cleanCardNumber);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-xl font-bold">
          ←
        </button>
        <h2 className="text-lg font-bold text-[#4a3b32]">Thẻ ngân hàng</h2>
      </div>

      {/* Box Tổng thanh toán */}
      <div className="bg-white rounded-xl p-4 text-center mb-6 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Tổng thanh toán</p>
        <h3 className="text-2xl font-bold text-[#4a3b32] my-1">
          {amount.toLocaleString("vi-VN")}đ
        </h3>
        <p className="text-xs text-gray-400">Mã đơn hàng: {orderId}</p>
      </div>

      {/* Form nhập liệu */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1"
      >
        <div className="mb-4">
          <label className="block text-xs font-bold text-[#4a3b32] mb-1">
            Số thẻ
          </label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className={`w-full p-3 border rounded-lg outline-none ${
              errors.cardNumber ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.cardNumber && (
            <p className="text-red-500 text-xs mt-1">
              Số thẻ không hợp lệ (cần 16 chữ số)
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-[#4a3b32] mb-1">
            Tên chủ thẻ
          </label>
          <input
            type="text"
            placeholder="NGUYEN VAN A"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
            className="w-full p-3 border border-gray-200 rounded-lg outline-none uppercase"
          />
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[#4a3b32] mb-1">
              Ngày hết hạn
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className={`w-full p-3 border rounded-lg outline-none ${
                errors.expiry ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.expiry && (
              <p className="text-red-500 text-xs mt-1">Thẻ đã hết hạn</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-[#4a3b32] mb-1">
              CVV
            </label>
            <input
              type="password"
              placeholder="***"
              maxLength={3}
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              className={`w-full p-3 border rounded-lg outline-none ${
                errors.cvv ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.cvv && (
              <p className="text-red-500 text-xs mt-1">CVV gồm 3 số</p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
          <span className="border rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">
            🛡
          </span>
          Cổng thanh toán giả lập (mock), không trừ tiền thật
        </p>

        {/* Nút Submit cố định dưới cùng */}
        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-[#c08d60] text-white py-4 rounded-xl font-bold"
          >
            Thanh toán {amount.toLocaleString("vi-VN")}đ
          </button>
        </div>
      </form>
    </div>
  );
}
