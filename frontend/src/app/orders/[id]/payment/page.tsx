'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Tải thông tin đơn hàng
  const fetchOrder = async () => {
    try {
      const res = await fetch(`http://localhost:3001/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error('Lỗi lấy trạng thái đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Polling mỗi 3 giây để cập nhật trạng thái đơn hàng tự động
  useEffect(() => {
    fetchOrder();

    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center text-[#F5EDE1] font-sans">
        Đang tải thông tin...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center text-red-400 font-sans">
        Không tìm thấy đơn hàng.
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN 2: ĐƠN ĐÃ TỰ ĐỘNG HỦY (CANCELLED)
  // ==========================================
  if (order.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex justify-center items-center py-6 px-3 font-sans selection:bg-transparent">
        <div className="w-[390px] h-[844px] bg-[#F5EDE1] rounded-[44px] shadow-2xl flex flex-col justify-between p-6 border-4 border-[#33312E] relative overflow-hidden">
          
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 mt-20">
            {/* Vòng tròn đồng hồ cảnh báo đỏ */}
            <div className="w-[84px] h-[84px] rounded-full bg-[#FBE5E5] flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D34545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2 className="text-[21px] font-bold text-[#3E2723] mb-3">
              Đơn đã tự động hủy
            </h2>

            <p className="text-[12.5px] text-[#6D5D53] leading-[1.6] max-w-[290px] mb-6">
              Đơn {order.code || 'CC-000004'} quá hạn thanh toán nên đã bị hủy. Các món đã giữ được trả lại kho, giỏ hàng của bạn vẫn còn.
            </p>

            <div className="bg-[#FCF4D9] border border-[#F0E4B8] text-[#8D6E42] text-[11px] font-medium px-4 py-2.5 rounded-full">
              PENDING → CANCELLED · quá 15 phút chưa thanh toán
            </div>
          </div>

          <div className="space-y-3 w-full pb-3">
            <button
              onClick={() => router.push(`/orders/${order.id}`)}
              className="w-full py-4 rounded-[18px] bg-[#B98353] hover:bg-[#A77244] text-white font-bold text-[14px] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Đặt lại đơn này
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 rounded-[18px] bg-white border border-[#B98353] hover:bg-[#FAF5EC] text-[#B98353] font-bold text-[14px] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN 1: ĐANG XỬ LÝ THANH TOÁN (PENDING)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#1E1E1E] flex justify-center items-center py-6 px-3 font-sans selection:bg-transparent">
      <div className="w-[390px] h-[844px] bg-[#F5EDE1] rounded-[44px] shadow-2xl flex flex-col justify-between p-5 border-4 border-[#33312E] relative overflow-hidden">
        
        {/* Nút quay lại */}
        <div className="pt-2 pb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#3E2723] font-bold text-[17px] hover:opacity-80 transition cursor-pointer"
          >
            <span>←</span> Thanh toán
          </button>
        </div>

        {/* Thân cuộn chứa các thẻ */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 no-scrollbar">
          
          {/* Card 1: Tổng thanh toán */}
          <div className="bg-white rounded-[22px] py-4 px-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <span className="text-[12px] text-[#7A6C62] font-medium">Tổng thanh toán</span>
            <div className="text-[26px] font-black text-[#261E1A] my-0.5 tracking-tight">
              {(order.total || 0).toLocaleString()}đ
            </div>
            <span className="text-[11.5px] text-[#9E9086]">
              Mã đơn hàng: {order.code || 'CC-000004'}
            </span>
          </div>

          {/* Card 2: Chuyển khoản QR */}
          <div className="bg-white rounded-[20px] p-3.5 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="w-12 h-12 rounded-[14px] bg-[#FDF7EE] flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B98353" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h2v2h-2z" />
                <path d="M19 14v3h2" />
                <path d="M14 19v2h3" />
                <path d="M19 20h2" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-[13px] text-[#3E2723]">Chuyển khoản QR</h4>
              <p className="text-[11.5px] text-[#7A6C62] mt-0.5">Quét mã bằng ứng dụng ngân hàng</p>
            </div>
          </div>

          {/* Card 3: Khối đồng hồ lớn Đang xử lý */}
          <div className="bg-white rounded-[26px] py-9 px-4 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <h3 className="font-bold text-[16.5px] text-[#3E2723] mb-7">
              Đang xử lý thanh toán
            </h3>
            
            <div className="w-[124px] h-[124px] rounded-full bg-[#FAF0E1] flex items-center justify-center mb-7 relative">
              <div className="w-[88px] h-[88px] rounded-full border-[2.2px] border-[#C59B70] flex items-center justify-center relative">
                <div className="w-[2.2px] h-[26px] bg-[#B98353] rounded-full absolute bottom-[42px] left-[42px] origin-bottom" />
                <div className="w-[20px] h-[2.2px] bg-[#B98353] rounded-full absolute top-[42px] left-[42px] origin-left rotate-30" />
                <div className="w-2 h-2 rounded-full bg-[#B98353] z-10" />
              </div>
            </div>

            <p className="text-[12px] text-[#7A6C62] font-medium">
              Vui lòng chờ hệ thống xác nhận thanh toán
            </p>
          </div>

          {/* Card 4: Thông báo đang xử lý giao dịch */}
          <div className="bg-white rounded-[18px] p-3.5 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FDF7EE] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B98353" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h5 className="font-bold text-[12.5px] text-[#3E2723]">Đang xử lý thanh toán</h5>
              <p className="text-[11px] text-[#7A6C62] mt-0.5 leading-tight">Hệ thống đang kiểm tra giao dịch của bạn.</p>
            </div>
          </div>

          {/* Card 5: Thông báo thanh toán an toàn */}
          <div className="bg-white rounded-[18px] p-3.5 flex items-center gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FDF7EE] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B98353" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <h5 className="font-bold text-[12.5px] text-[#3E2723]">Thanh toán an toàn</h5>
              <p className="text-[11px] text-[#7A6C62] mt-0.5 leading-tight">Vui lòng không chia sẻ thông tin giao dịch với người khác.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}