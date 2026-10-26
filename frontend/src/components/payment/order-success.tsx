
interface OrderSuccessProps {
  orderId: string;
  amount: number;
  method: string;
  points: number;
  onTrackOrder: () => void;
  onGoHome: () => void;
}

export default function OrderSuccess({
  orderId,
  amount,
  method,
  points,
  onTrackOrder,
  onGoHome,
}: OrderSuccessProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-[#F5EBE1] min-h-screen">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mt-8">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#4a3b32]">Đặt hàng thành công!</h2>
      <p className="text-sm text-gray-500 mb-6">Cảm ơn bạn đã đặt hàng</p>

      <div className="w-full bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">Mã đơn hàng</span>
          <span className="font-bold">{orderId}</span>
        </div>
        <div className="flex justify-between mb-2 items-center">
          <span className="text-gray-500">Trạng thái</span>
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
            PAID - Đã thanh toán
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">Thanh toán</span>
          <span className="font-medium">{method}</span>
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-dashed">
          <span className="text-gray-500">Tổng thanh toán</span>
          <span className="font-bold">{amount.toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      <div className="w-full bg-[#fcf8e3] text-[#a67c52] rounded-xl p-4 mb-4 text-sm font-medium flex items-center shadow-sm">
        ☕ Mời tới quầy lấy nước khi đơn sẵn sàng
      </div>
      <div className="w-full bg-white rounded-xl p-4 mb-8 shadow-sm flex items-center gap-3 border border-gray-100">
        <span className="text-orange-400 text-xl">⭐</span>
        <div>
          <p className="font-bold text-[#4a3b32]">+{points} điểm thưởng</p>
          <p className="text-xs text-gray-400">Tổng điểm của bạn: 1.250 điểm</p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 mt-auto">
        <button
          onClick={onTrackOrder}
          className="w-full bg-[#c08d60] text-white py-3 rounded-xl font-bold"
        >
          Theo dõi đơn hàng
        </button>
        <button
          onClick={onGoHome}
          className="w-full bg-white border border-[#c08d60] text-[#c08d60] py-3 rounded-xl font-bold"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
