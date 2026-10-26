// --- PHẦN DỮ LIỆU SẢN PHẨM (Của bạn) ---
export interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
}

export interface ProductSize {
  size: "S" | "M" | "L";
  additionalPrice: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  price: number; // Tổng giá cuối cùng hoặc giá mặc định
  imageUrl: string;
  stock: number;
  isOutOfStock: boolean;
  category: Pick<Category, "id" | "name" | "slug">;
  sizes: ProductSize[];
}

// --- PHẦN DỮ LIỆU THANH TOÁN (Bổ sung cho Task 8 & 10) ---

// Các phương thức thanh toán hỗ trợ
export type PaymentMethod = "E_WALLET" | "CARD" | "QR";

// Quản lý trạng thái luồng UI thay cho Router
export type ScreenState =
  | "SELECT_METHOD"
  | "CARD_FORM"
  | "QR_CODE"
  | "PROCESSING"
  | "FAILED"
  | "ORDER_SUCCESS";

// Payload gửi lên API POST /payments
export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  // Dành riêng cho thẻ
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

// Payload nhận về từ backend
export interface PaymentResponse {
  status: "PAID" | "PAYMENT_FAILED";
  rewardPoints: number; // Yêu cầu: 1 điểm / 10.000đ
  orderId: string;
}
