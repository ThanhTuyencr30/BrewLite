// frontend/src/app/orders/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PROCESSING', label: 'Đang xử lý' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  // Dữ liệu mẫu (Dùng để test UI)
  const MOCK_ORDERS = [
    { id: '4', code: 'CC-000004', time: '25/10/2026 - 09:36', total: 119000, status: 'PREPARING', statusText: 'Đang pha chế', items: 'Cà phê sữa, Cappuccino,...', itemCount: 4, badgeBg: 'bg-[#FFF3D8]', badgeText: 'text-[#D4A34B]' },
    { id: '3', code: 'CC-000003', time: '25/10/2026 - 09:36', total: 77000, status: 'COMPLETED', statusText: 'Hoàn tất', items: 'Americano, Trà đào,...', itemCount: 2, badgeBg: 'bg-[#E6F4EA]', badgeText: 'text-[#1E8E3E]' },
    { id: '2', code: 'CC-000002', time: '25/10/2026 - 09:36', total: 45000, status: 'PAYMENT_FAILED', statusText: 'Thanh toán lỗi', items: 'Matcha Latte', itemCount: 1, badgeBg: 'bg-[#FCE8E6]', badgeText: 'text-[#D93025]' },
    { id: '1', code: 'CC-000001', time: '25/10/2026 - 09:36', total: 80000, status: 'CANCELLED', statusText: 'Đã hủy', items: 'Cà phê muối, Mocha', itemCount: 2, badgeBg: 'bg-[#F1F3F4]', badgeText: 'text-[#5F6368]' },
  ];

  // LOGIC LỌC CHUẨN XÁC 100%
  const filteredOrders = MOCK_ORDERS.filter((order) => {
    // Ép kiểu về chữ in hoa để tránh lỗi Backend trả về chữ thường
    const status = order.status.toUpperCase(); 

    if (activeTab === 'ALL') return true; // Tất cả hiện tất cả
    
    if (activeTab === 'PROCESSING') {
      return ['PENDING', 'PAID', 'PREPARING', 'READY'].includes(status);
    }
    
    if (activeTab === 'COMPLETED') {
      return status === 'COMPLETED'; // Chỉ hiện Hoàn thành
    }
    
    if (activeTab === 'CANCELLED') {
      return status === 'CANCELLED'; // Chỉ hiện Đã hủy
    }
    
    return false;
  });

  return (
    <div className="min-h-screen bg-[#F8F5EC] flex justify-center font-sans">
      <div className="w-full max-w-[400px] bg-[#F8F5EC] min-h-screen relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center px-5 pt-8 pb-5">
          <button onClick={() => router.back()} className="mr-3 text-[#222]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-[19px] font-bold text-[#222]">Lịch sử đặt hàng</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pb-3 mb-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors border flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-[#C28E5E] text-white border-[#C28E5E]' 
                  : 'bg-transparent text-[#333] border-[#C28E5E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách đơn */}
        <div className="flex-1 px-4 pb-10">
          {filteredOrders.length === 0 ? (
            <div className="text-center text-[#888] mt-10">Không có đơn hàng nào trong mục này.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#F0EAD6]">
                  
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-[#333] text-[14px]">#{order.code}</p>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${order.badgeBg} ${order.badgeText}`}>
                      {order.statusText}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mb-3.5">
                    <div className="w-[60px] h-[60px] bg-[#F2E9D8] rounded-xl flex-shrink-0"></div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-bold text-[#333] text-[13.5px] line-clamp-1">{order.items}</p>
                      <p className="text-[12px] text-[#888] mt-1">{order.itemCount} sản phẩm · {order.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-[#F5F0E1]">
                    <p className="text-[13px] text-[#333] font-medium">
                      Tổng tiền: <span className="font-bold text-[14px]">{order.total.toLocaleString()}đ</span>
                    </p>
                    <Link 
                      href={`/orders/${order.id}`} 
                      className="bg-[#C28E5E] text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#B08054] transition-colors"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}