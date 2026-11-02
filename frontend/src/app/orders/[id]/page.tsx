'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_FAILED';

type OrderItem = {
  id: string;
  name: string;
  size: string;
  topping: string;
  qty: number;
  price: number;
  image: string;
};

type OrderSummary = {
  code: string;
  status: OrderStatus;
  time: string;
  total: number;
  refund?: number;
  items: number;
};

type OrderDetail = OrderSummary & { itemsList: OrderItem[] };

// Giả lập dữ liệu cho các trạng thái khác nhau
const MOCK_DATA: Record<string, OrderSummary> = {
  '1': { code: 'CC-000001', status: 'CANCELLED', time: '25/10/2026 - 09:36', total: 80000, refund: 80000, items: 2 },
  '2': { code: 'CC-000002', status: 'PAYMENT_FAILED', time: '25/10/2026 - 09:36', total: 45000, items: 1 },
  '3': { code: 'CC-000003', status: 'COMPLETED', time: '25/10/2026 - 09:36', total: 77000, items: 2 },
  '4': { code: 'CC-000004', status: 'PREPARING', time: '25/10/2026 - 09:36', total: 119000, items: 4 },
};

const MOCK_ITEMS: OrderItem[] = [
  { id: '1', name: 'Cà Phê Sữa', size: 'M', topping: 'Không topping', qty: 1, price: 28000, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop' },
  { id: '2', name: 'Cappuccino', size: 'M', topping: 'Không topping', qty: 1, price: 40000, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=200&auto=format&fit=crop' },
  { id: '3', name: 'Americano', size: 'M', topping: 'Không topping', qty: 1, price: 32000, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?q=80&w=200&auto=format&fit=crop' },
  { id: '4', name: 'Caramel Macchiato', size: 'M', topping: 'Không topping', qty: 1, price: 40000, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=200&auto=format&fit=crop' },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [viewMode, setViewMode] = useState<'DETAIL' | 'TRACKING'>('DETAIL');

  const order = useMemo<OrderDetail>(
    () => ({ ...(MOCK_DATA[id] ?? MOCK_DATA['4']), itemsList: MOCK_ITEMS }),
    [id],
  );

  const isCancelled = order.status === 'CANCELLED';
  const isPaymentFailed = order.status === 'PAYMENT_FAILED';
  const isCompleted = order.status === 'COMPLETED';

  const timelineSteps = [
    { key: 'PENDING', label: 'Chờ thanh toán', sub: 'PENDING' },
    { key: 'PAID', label: 'Đã thanh toán', sub: 'PAID' },
    { key: 'PREPARING', label: 'Đang pha chế', sub: 'PREPARING' },
    { key: 'READY', label: 'Sẵn sàng nhận', sub: 'READY' },
    { key: 'COMPLETED', label: 'Hoàn tất', sub: 'COMPLETED' },
  ];

  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepKey);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-[#F8F5EC] flex justify-center font-sans pb-24">
      <div className="w-full max-w-[400px] bg-[#F8F5EC] min-h-screen relative shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-8 pb-4 sticky top-0 bg-[#F8F5EC] z-10">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-3 text-[#222]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 className="text-[19px] font-bold text-[#222]">
              {viewMode === 'DETAIL' ? `Chi tiết đơn ${order.code}` : 'Theo dõi đơn hàng'}
            </h1>
          </div>
          <button className="text-[#222]">
            {viewMode === 'DETAIL' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            )}
          </button>
        </div>

        <div className="px-4 space-y-4">
          
          {/* ================= 1. GIAO DIỆN CHI TIẾT ĐƠN (Trang 41) ================= */}
          {viewMode === 'DETAIL' && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EAD6] overflow-hidden">
                {order.itemsList.map((item) => (
                  <div key={item.id} className="flex gap-3 p-4 border-b border-[#F5F0E1] last:border-0">
                    <img src={item.image} alt={item.name} className="w-[70px] h-[70px] rounded-xl object-cover" />
                    <div className="flex-1 flex justify-between">
                      <div>
                        <p className="font-bold text-[#333] text-[15px]">{item.name}</p>
                        <p className="text-[13px] text-[#888] mt-0.5">Size {item.size}</p>
                        <p className="text-[13px] text-[#888]">{item.topping}</p>
                        <p className="text-[13px] text-[#888] mt-1">Số lượng: {item.qty}</p>
                      </div>
                      <p className="font-bold text-[#C28E5E] text-[15px]">{(item.price * item.qty).toLocaleString()}đ</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F0EAD6] text-[14px] space-y-2.5">
                <div className="flex justify-between text-[#333]"><span>Tạm tính</span><span className="font-medium">140.000đ</span></div>
                <div className="flex justify-between text-[#333]"><span>Giảm giá</span><span className="font-medium">-21.000đ</span></div>
                <div className="flex justify-between font-bold text-[#333] text-[16px] pt-2 border-t border-[#F5F0E1]"><span>Tổng cộng</span><span>{order.total.toLocaleString()}đ</span></div>
              </div>
            </>
          )}

          {/* ================= 2. GIAO DIỆN THEO DÕI ĐƠN (Trang 50, 51, 54, 56, 57) ================= */}
          {viewMode === 'TRACKING' && (
            <>
              {/* Trạng thái ĐÃ HỦY (Trang 48) */}
              {isCancelled ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm text-center mt-2 border border-[#F0EAD6]">
                  <div className="w-16 h-16 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E8E3E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h2 className="text-[17px] font-bold text-[#333] mb-2">Đã hủy đơn {order.code}</h2>
                  <p className="text-[13px] text-[#888]">Đơn đã được hủy trước khi quán bắt đầu pha chế.</p>
                  
                  <div className="mt-6 border-t border-[#F5F0E1] pt-4 text-[13px] space-y-3 text-left">
                    <div className="flex justify-between"><span className="text-[#888]">Hoàn tiền</span><span className="font-bold text-[#333]">{(order.refund ?? 0).toLocaleString()}đ · về Ví điện tử</span></div>
                    <div className="flex justify-between"><span className="text-[#888]">Dự kiến</span><span className="font-bold text-[#333]">1–3 ngày làm việc</span></div>
                    <div className="flex justify-between"><span className="text-[#888]">Điểm thưởng</span><span className="font-bold text-[#D93025]">-11 điểm (đã thu hồi)</span></div>
                    <div className="flex justify-between"><span className="text-[#888]">Mã GIAM15%</span><span className="font-bold text-[#333]">Được hoàn lại lượt dùng</span></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Card thông tin đơn */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-[#F0EAD6]">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-[#333] text-[15px]">Đơn hàng {order.code}</p>
                      {isPaymentFailed ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-[#FCE8E6] text-[#D93025] rounded-md">Thanh toán lỗi</span>
                      ) : isCompleted ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4EA] text-[#1E8E3E] rounded-md">Hoàn tất</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-bold bg-[#E6F4EA] text-[#1E8E3E] rounded-md">Đã thanh toán</span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#888]">{order.items} sản phẩm · {order.total.toLocaleString()}đ · Đặt lúc 09:36</p>
                  </div>

                  {/* Card Nhận tại quầy */}
                  <div className="bg-[#FDF3D9] p-4 rounded-xl flex gap-3 items-start">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C28E5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                    <div>
                      <p className="font-bold text-[#333] text-[14px]">Nhận tại quầy</p>
                      <p className="text-[12px] text-[#666] mt-0.5">Đọc mã đơn {order.code} cho nhân viên khi nhận nước</p>
                    </div>
                  </div>

                  {/* Timeline Trạng thái (Trang 50, 51, 54, 56, 57) */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#F0EAD6]">
                    <div className="space-y-5">
                      {timelineSteps.map((step) => {
                        const status = getStepStatus(step.key);
                        const isPending = step.key === 'PENDING';
                        const isPaid = step.key === 'PAID';
                        
                        if (isPaymentFailed && !isPending && !isPaid) return null;

                        return (
                          <div key={step.key} className="relative flex gap-4 items-center">
                            {/* Icon Check/Tròn/Xám */}
                            <div className={`w-[22px] h-[22px] rounded-full flex-shrink-0 flex items-center justify-center z-10 
                              ${status === 'completed' ? 'bg-[#1E8E3E]' : 
                                status === 'current' ? 'bg-white border-[3px] border-[#C28E5E]' : 
                                'bg-transparent border-[2px] border-[#E0E0E0]'}`}>
                              {status === 'completed' && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              )}
                              {status === 'current' && <div className="w-[8px] h-[8px] bg-[#C28E5E] rounded-full"></div>}
                            </div>
                            
                            {/* Nội dung Text */}
                            <div className="flex-1 flex justify-between items-center">
                              <p className={`text-[14px] font-bold ${status === 'current' ? 'text-[#C28E5E]' : status === 'completed' ? 'text-[#333]' : 'text-[#BDBDBD]'}`}>
                                {step.label}
                                <span className="block text-[11px] font-normal text-[#BDBDBD] mt-0.5">{step.sub}</span>
                              </p>
                              <p className="text-[12px] text-[#888]">
                                {status === 'completed' || status === 'current' ? '09:36' : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Dòng lỗi thanh toán (Trang 51) */}
                      {isPaymentFailed && (
                        <div className="relative flex gap-4 items-center pt-2">
                          <div className="w-[22px] h-[22px] rounded-full bg-[#D93025] flex items-center justify-center z-10">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <p className="text-[14px] font-bold text-[#D93025]">Thanh toán thất bại<span className="block text-[11px] font-normal text-[#D93025] mt-0.5">PAYMENT_FAILED</span></p>
                            <p className="text-[12px] text-[#888]">09:37</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ================= BOTTOM BAR (NÚT HÀNH ĐỘNG) ================= */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto p-4 bg-[#F8F5EC]">
          
          {/* Nút chuyển sang Theo dõi (Trang 41) */}
          {viewMode === 'DETAIL' && (
            <div 
              onClick={() => setViewMode('TRACKING')}
              className="bg-[#C28E5E] p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-[#B08054] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                </div>
                <div>
                  <p className="text-[11px] text-white/90">Trạng thái đơn</p>
                  <p className="font-bold text-white text-[13px]">Đang pha chế (PREPARING) · Nhận tại quầy</p>
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          )}

          {/* Nút Hành động ở màn hình Theo dõi */}
          {viewMode === 'TRACKING' && (
            <>
              {isCancelled && (
                <div className="space-y-2">
                  <button onClick={() => setViewMode('DETAIL')} className="w-full py-3.5 border border-[#C28E5E] text-[#C28E5E] font-bold rounded-xl text-[14px]">Xem lịch sử đơn hàng</button>
                  <Link href="/" className="block w-full py-3.5 border border-[#C28E5E] text-[#C28E5E] font-bold rounded-xl text-center text-[14px]">Về trang chủ</Link>
                </div>
              )}

              {isPaymentFailed && (
                <div className="space-y-2">
                  <button className="w-full py-3.5 bg-[#C28E5E] text-white font-bold rounded-xl text-[14px]">Thanh toán lại</button>
                  <button onClick={() => setShowCancelModal(true)} className="w-full py-3.5 border border-[#D93025] text-[#D93025] font-bold rounded-xl text-[14px]">Hủy đơn hàng</button>
                </div>
              )}

              {!isCancelled && !isPaymentFailed && (
                <div>
                  {isCompleted ? (
                    <div className="space-y-2">
                      <button className="w-full py-3.5 bg-[#C28E5E] text-white font-bold rounded-xl text-[14px]">Đặt lại đơn này</button>
                      <Link href="/" className="block w-full py-3.5 border border-[#C28E5E] text-[#333] font-bold rounded-xl text-center text-[14px] bg-white">Về trang chủ</Link>
                    </div>
                  ) : (
                    <div>
                      <button disabled className="w-full py-3.5 bg-[#E0E0E0] text-[#A0A0A0] font-bold rounded-xl text-[14px]">Hủy đơn hàng</button>
                      <p className="text-center text-[11px] text-[#888] mt-2">Chỉ hủy được khi đơn chưa chuyển sang pha chế</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ================= POPUP HỦY ĐƠN (Trang 42) ================= */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-[24px] w-full max-w-[320px] text-center shadow-2xl">
              <h2 className="text-[18px] font-bold mb-2 text-[#333]">Hủy đơn hàng?</h2>
              <p className="mb-6 text-[13px] text-[#888] leading-relaxed">Đơn {order.code} sẽ bị hủy. Số tiền đã thanh toán sẽ được hoàn lại.</p>
              
              <div className="flex justify-between gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 border border-[#C28E5E] text-[#333] rounded-xl font-bold text-[14px]">Giữ đơn</button>
                <button onClick={() => { alert('Đã hủy đơn!'); setShowCancelModal(false); router.push('/orders/1'); }} className="flex-1 py-3 bg-[#D93025] text-white rounded-xl font-bold text-[14px]">Hủy đơn</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}