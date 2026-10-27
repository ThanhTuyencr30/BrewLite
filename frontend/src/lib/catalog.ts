import { fetchJson } from "./api";

export type ProductSize = "S" | "M" | "L";

export type ProductDetails = {
  id: number;
  name: string;
  category: string;
  price: number;
  sizePrices: Record<ProductSize, number>;
  imageUrl: string;
  stock: number;
  isAvailable: boolean;
};

export type Topping = {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
};

export type BaristaOrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export type BaristaOrder = {
  id: string;
  status: BaristaOrderStatus;
  itemCount: number;
  total: number;
  placedAt: string;
};

export function getProductDetails(
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetails> {
  return fetchJson<ProductDetails>(`/products/${encodeURIComponent(id)}`, {
    signal,
  });
}

export function getToppings(signal?: AbortSignal): Promise<Topping[]> {
  return fetchJson<Topping[]>("/toppings", { signal });
}

export function updateOrderStatus(
  id: string,
  status: BaristaOrderStatus,
): Promise<BaristaOrder> {
  return fetchJson<BaristaOrder>(
    `/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function getBaristaOrders(signal?: AbortSignal): Promise<BaristaOrder[]> {
  return fetchJson<BaristaOrder[]>("/orders/barista", { signal });
}
