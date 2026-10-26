'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Danh sách voucher từ API
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState<boolean>(false);
  const [showVoucherSheet, setShowVoucherSheet] = useState<boolean>(false);

  // 1. Tải thông tin đơn hàng
  const fetchOrder = () => {
    if (!orderId) return;
    fetch(`http://localhost:3001/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);

        if (data.status === 'PENDING' && data.expiresAt) {
          const expiresTime = new Date(data.expiresAt).getTime();
          const now = new Date().getTime();
          const secondsRemaining = Math.max(0, Math.floor((expiresTime - now) / 1000));
          setTimeLeft(secondsRemaining);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải đơn hàng:', err);
        setOrder(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // 2. Tải danh sách mã giảm giá từ backend
  useEffect(() => {
    setLoadingVouchers(true);
    fetch('http://localhost:3001/promotions')
      .then((res) => res.json())
      .then((data) => {
        setVouchers(Array.isArray(data) ? data : []);
        setLoadingVouchers(false);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách mã giảm giá:', err);
        setLoadingVouchers(false);
      });
  }, []);

  // 3. Đếm ngược thời gian thanh toán
  useEffect(() => {
    if (timeLeft <= 0 || order?.status !== 'PENDING') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setOrder((curr: any) => (curr ? { ...curr, status: 'CANCELLED' } : null));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, order?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 4. Áp dụng mã giảm giá qua API Backend
  const handleApplyVoucher = async (code: string) => {
    try {
      const res = await fetch('http://localhost:3001/promotions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setShowVoucherSheet(false);
      } else {
        alert(data.message || 'Không thể áp dụng mã');
      }
    } catch (err) {
      console.error('Lỗi áp mã giảm giá:', err);
    }
  };

  // 5. Gỡ mã giảm giá qua API Backend
  const handleRemoveVoucher = async () => {
    try {
      const res = await fetch(`http://localhost:3001/promotions/remove/${order.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
      } else {
        alert(data.message || 'Không thể gỡ mã');
      }
    } catch (err) {
      console.error('Lỗi gỡ mã giảm giá:', err);
    }
  };

  // 6. Thanh toán
  const handlePayment = async () => {
    if (!order) return;
    try {
      const res = await fetch('http://localhost:3001/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          idempotencyKey: `pay-${order.id}-${Date.now()}`,
          method: 'QR',
          amount: order.total,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Thanh toán thành công!');
        fetchOrder();
      } else {
        alert(data.message || 'Thanh toán thất bại');
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#2D2A26] text-[#F7F2E8]">Đang tải đơn hàng...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center bg-[#2D2A26] text-red-400">Không tìm thấy đơn hàng.</div>;

  const isVoucherApplied = Boolean(order.promotionId || order.promotion);

  return (
    <div className="min-h-screen bg-[#2D2A26] flex justify-center items-center py-4 px-2">
      {/* Khung điện thoại 390px x 844px */}
      <div className="w-[390px] h-[844px] bg-[#F7F2E8] rounded-[40px] shadow-2xl flex flex-col justify-between overflow-hidden relative font-sans border-4 border-[#3D3A35]">
        
        {/* HEADER */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between flex-shrink-0 bg-[#F7F2E8] z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#3D3532] font-bold text-lg hover:opacity-85 transition cursor-pointer"
          >
            <span>←</span> Đơn hàng của bạn
          </button>
          
          <div className="relative cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3D3532]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {order.items?.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#D9534F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {order.items.length}
              </span>
            )}
          </div>
        </div>

        {/* NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3">
          {order.status === 'PENDING' && timeLeft > 0 && (
            <div className="bg-[#EFE8DC] border border-[#E0D4C3] px-3.5 py-2 rounded-2xl flex justify-between items-center shadow-xs">
              <span className="text-xs text-[#7A6B5D] font-medium">Thời gian thanh toán:</span>
              <span className="text-xs font-bold text-[#B33939] bg-white px-2.5 py-1 rounded-xl border border-[#EED2D2]">
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {/* Danh sách món nước */}
          {(!order.items || order.items.length === 0) ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-[#7E7065] border border-[#EFEBE4] mt-6">
              Đơn hàng chưa có sản phẩm nào.
            </div>
          ) : (
            order.items.map((item: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl p-3.5 shadow-xs flex gap-3.5 items-center border border-[#EFEBE4]">
                <div className="w-14 h-14 bg-[#F2EDE4] rounded-xl flex-shrink-0 flex items-center justify-center text-xl text-[#A67C52] border border-[#E5DDD0]">
                  ☕
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#3D3532] text-sm truncate">{item.productName || 'Sản phẩm'}</h4>
                  <p className="text-[11px] text-[#7E7065] mt-0.5">Size {item.size || 'M'} • SL: {item.quantity || 1}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-[#A65B32] text-sm">
                    {(item.lineTotal || 0).toLocaleString()}đ
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Thẻ mã giảm giá đã áp dụng (Giao diện 31) */}
          {isVoucherApplied && (
            <div className="bg-[#E2F4E9] border border-[#BCE7CE] rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[#2E7D32] text-xl">🏷️</span>
                <div>
                  <h5 className="font-bold text-[#2E7D32] text-xs">{order.promotion?.code || 'GIAM15%'}</h5>
                  <p className="text-[11px] text-[#4F7A5E] mt-0.5">
                    {order.promotion?.description || 'Giảm giá theo chương trình ưu đãi'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleRemoveVoucher}
                className="text-[#D32F2F] text-xs font-bold hover:underline cursor-pointer px-2 py-1"
              >
                Gỡ
              </button>
            </div>
          )}

          {/* Bảng tổng tiền */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#EFEBE4] space-y-2">
            <div className="flex justify-between text-xs text-[#7E7065]">
              <span>Tạm tính</span>
              <span className="font-semibold text-[#3D3532]">
                {(order.subtotal || order.total || 0).toLocaleString()}đ
              </span>
            </div>
            
            <div className="flex justify-between text-xs text-[#7E7065]">
              <span>Giảm giá {order.promotion?.code ? `(${order.promotion.code})` : ''}</span>
              <span className={`font-semibold ${(order.discount || 0) > 0 ? 'text-[#2E7D32]' : 'text-[#3D3532]'}`}>
                {(order.discount || 0) > 0 ? `-${order.discount.toLocaleString()}đ` : '0đ'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#F5F1EC] flex justify-between items-center">
              <span className="font-bold text-[#3D3532] text-sm">Tổng cộng</span>
              <span className="font-bold text-[#3D3532] text-base">
                {(order.total || 0).toLocaleString()}đ
              </span>
            </div>
          </div>
        </div>

        {/* NÚT THAO TÁC Ở ĐÁY */}
        <div className="p-4 bg-[#F7F2E8] border-t border-[#EAE3D9] space-y-2.5 flex-shrink-0 z-10 shadow-lg">
          {!isVoucherApplied ? (
            /* Trạng thái Giao diện 27 */
            <div 
              onClick={() => setShowVoucherSheet(true)}
              className="bg-white rounded-2xl px-4 py-3 flex justify-between items-center shadow-xs border border-[#EFEBE4] cursor-pointer hover:border-[#D5C9B4] transition"
            >
              <span className="font-bold text-[#3D3532] text-xs">Áp mã giảm giá</span>
              <span className="text-[#3D3532] text-sm font-light">→</span>
            </div>
          ) : (
            /* Trạng thái Giao diện 31 */
            <button 
              onClick={() => setShowVoucherSheet(true)}
              className="w-full bg-white border border-[#BA8B5C] hover:bg-[#FAF6F0] text-[#3D3532] font-bold py-3 rounded-2xl shadow-xs text-xs transition cursor-pointer text-center"
            >
              Đổi mã giảm giá
            </button>
          )}

          <button
            onClick={handlePayment}
            className={`w-full py-3.5 rounded-2xl shadow-xs flex justify-center items-center font-bold text-sm transition cursor-pointer ${
              isVoucherApplied
                ? 'bg-[#B68153] hover:bg-[#A37145] text-white'
                : 'bg-[#FAF7F2] border border-[#D9CEBC] hover:bg-[#F2ECE1] text-[#3D3532] justify-between px-5'
            }`}
          >
            <span>Thanh toán</span>
            {!isVoucherApplied && <span className="text-sm font-light">→</span>}
          </button>
        </div>

        {/* BOTTOM SHEET CHỌN MÃ */}
        {showVoucherSheet && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-end justify-center z-50 animate-in fade-in">
            <div className="w-full bg-[#FAF7F2] rounded-t-[32px] p-5 border-t border-[#EAE3D9] shadow-2xl max-h-[70%] flex flex-col">
              
              <div className="flex justify-between items-center pb-3 border-b border-[#EAE3D9]">
                <h3 className="font-bold text-[#3D3532] text-sm">Chọn mã giảm giá của bạn</h3>
                <button 
                  onClick={() => setShowVoucherSheet(false)} 
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#EAE3D9] text-[#7A6B5D] text-xs font-bold hover:opacity-80"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto space-y-2.5 py-4">
                {loadingVouchers && (
                  <p className="text-center text-xs text-gray-500 py-4">Đang tải mã giảm giá...</p>
                )}

                {!loadingVouchers && vouchers.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-4">Hiện không có mã giảm giá nào khả dụng.</p>
                )}

                {!loadingVouchers && vouchers.map((v) => (
                  <div
                    key={v.id || v.code}
                    onClick={() => handleApplyVoucher(v.code)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                      order.promotionId === v.id || order.promotion?.code === v.code
                        ? 'bg-[#E2F4E9] border-[#2E7D32]'
                        : 'bg-white border-[#EAE3D9] hover:border-[#BA8B5C]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏷️</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#3D3532]">{v.code}</h4>
                        <p className="text-[11px] text-[#7E7065] mt-0.5">{v.description || 'Ưu đãi đơn hàng'}</p>
                      </div>
                    </div>

                    <input
                      type="radio"
                      checked={order.promotionId === v.id || order.promotion?.code === v.code}
                      readOnly
                      className="w-4 h-4 accent-[#BA8B5C] cursor-pointer"
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}