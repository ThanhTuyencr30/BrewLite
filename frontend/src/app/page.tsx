'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');

  const API_URL = 'http://localhost:3001';

  // Dữ liệu giả lập (Dùng khi chưa bật Backend/Database)
  const MOCK_ORDERS = [
    { id: '1', code: 'ORD-001', createdAt: new Date().toISOString(), total: 50000, status: 'PENDING' },
    { id: '2', code: 'ORD-002', createdAt: new Date(Date.now() - 86400000).toISOString(), total: 75000, status: 'COMPLETED' },
    { id: '3', code: 'ORD-003', createdAt: new Date(Date.now() - 172800000).toISOString(), total: 45000, status: 'CANCELLED' },
  ];

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PROCESSING', label: 'Đang xử lý' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  const fetchOrders = async (tab: string) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/orders/me`;
      if (tab === 'COMPLETED' || tab === 'CANCELLED') {
        url += `?status=${tab}`;
      }
      
      // Cố gắng gọi API thật
      const res = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) throw new Error('Chưa có DB hoặc lỗi API');
      
      const data = await res.json();
      filterData(data, tab);

    } catch (error) {
      // Nếu API lỗi (chưa bật backend/DB), tự động dùng dữ liệu giả để hiển thị UI
      console.log("Đang dùng dữ liệu giả lập cho UI");
      filterData(MOCK_ORDERS, tab);
    }
  };

  const filterData = (data: any[], tab: string) => {
    if (tab === 'PROCESSING') {
      setOrders(data.filter((o: any) => ['PENDING', 'PAID', 'PREPARING', 'READY'].includes(o.status)));
    } else {
      setOrders(data);
    }
  };

  useEffect(() => { fetchOrders(activeTab); }, [activeTab]);

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Lịch sử đơn hàng</h1>
      
      {/* Thanh Tabs */}
      <div className="flex space-x-2 mb-6 border-b pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn */}
      <div className="space-y-4">
        {orders.length === 0 && <p className="text-center text-gray-500 py-10">Không có đơn hàng nào.</p>}
        
        {orders.map((order: any) => (
          <div key={order.id} className="border p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow">
            <div>
              <p className="font-bold text-lg text-gray-800">Mã đơn: {order.code}</p>
              <p className="text-sm text-gray-500">Ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
              <p className="text-base font-semibold text-orange-600 mt-1">Tổng: {order.total?.toLocaleString()}đ</p>
              
              {/* Badge trạng thái */}
              <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-bold rounded-md
                ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                  'bg-blue-100 text-blue-700'}`}
              >
                {order.status}
              </span>
            </div>
            
            <Link 
              href={`/orders/${order.id}`}
              className="text-blue-600 font-medium hover:underline text-center md:text-right"
            >
              Xem chi tiết &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}