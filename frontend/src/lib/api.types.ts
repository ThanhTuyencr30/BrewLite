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

export interface Promotion {
  id: number;
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  isAvailable: boolean;
  availabilityMessage: string | null;
}

export interface PromotionValidation {
  valid: true;
  promotion: Promotion;
  discount: number;
  subtotal: number;
  total: number;
}

export interface CartValidationInputItem {
  productId: number;
  size: ProductSize["size"];
  quantity: number;
  expectedUnitPrice: number;
}

export interface CartValidationResult {
  valid: boolean;
  subtotal: number;
  items: {
    productId: number;
    size: ProductSize["size"];
    quantity: number;
    currentUnitPrice: number;
    availableStock: number;
    priceChanged: boolean;
  }[];
  issues: {
    productId: number;
    reason: "UNAVAILABLE" | "OUT_OF_STOCK" | "PRICE_CHANGED";
    message: string;
    productName: string;
    requestedQuantity: number;
    availableStock: number;
  }[];
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

// Payload gửi lên API POST /payments. Thông tin thẻ không được gửi lên backend.
export interface PaymentRequest {
  orderId: string;
  method: PaymentMethod;
}

// Bản ghi thanh toán backend trả về
export interface PaymentResponse {
  id: string;
  orderId: string;
  method: "WALLET" | "CARD" | "QR";
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  amount: number;
  failureReason: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  loyaltyPoints: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export interface CreateOrderRequest {
  items: {
    productId: number;
    size: ProductSize["size"];
    iceLevel: "NORMAL" | "LESS" | "NONE";
    quantity: number;
    toppingIds: number[];
  }[];
  discountCode?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  size: ProductSize["size"];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: { imageUrl: string };
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: string | null;
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItem[];
}
