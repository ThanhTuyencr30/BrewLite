import type {
  Category,
  Product,
  PaymentRequest,
  PaymentResponse,
} from "./api.types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getCategories(signal: AbortSignal) {
  return fetchJson<Category[]>("/categories", signal);
}

export function getProducts(
  filters: { search: string; category: string },
  signal: AbortSignal
) {
  const searchParams = new URLSearchParams();

  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  if (filters.category !== "all") {
    searchParams.set("category", filters.category);
  }

  const query = searchParams.toString();
  return fetchJson<Product[]>(`/products${query ? `?${query}` : ""}`, signal);
}

export async function submitPayment(
  payload: PaymentRequest,
  signal?: AbortSignal
): Promise<PaymentResponse> {
  const idempotencyKey = crypto.randomUUID();

  // Tạo UUID giả vì backend đang dùng @IsUUID() cho orderId.
  // (Mã "CC-000004" của frontend không phải UUID).
  const orderId = crypto.randomUUID();

  // Format lại payload để đưa idempotencyKey và orderId vào body
  const requestBody = {
    ...payload,
    method: payload.method === "E_WALLET" ? "WALLET" : payload.method,
    idempotencyKey: idempotencyKey,
    orderId: orderId,
  };

  const response = await fetch(`${API_BASE_URL}/payments`, {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // Đã xóa Idempotency-Key khỏi header vì DTO backend đang đọc từ Body
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(
      `Payment API request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<PaymentResponse>;
}
