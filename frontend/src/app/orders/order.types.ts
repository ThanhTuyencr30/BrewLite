export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export interface OrderItem {
  id: number;
  productName: string;
  size: "S" | "M" | "L";
  quantity: number;
  lineTotal: number;
}

export interface OrderPromotion {
  id: number;
  code: string;
  description: string | null;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: string | null;
  promotionId: number | null;
  promotion: OrderPromotion | null;
  items: OrderItem[];
}

export interface Promotion {
  id: number;
  code: string;
  description: string | null;
}
