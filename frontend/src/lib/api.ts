import type {
  CartValidationResult,
  CartValidationInputItem,
  Category,
  PaymentRequest,
  PaymentResponse,
  Product,
  Promotion,
  PromotionValidation,
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

async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null);
    let message = `API request failed with status ${response.status}`;
    if (responseBody && typeof responseBody === "object" && "message" in responseBody) {
      if (typeof responseBody.message === "string") {
        message = responseBody.message;
      } else if (Array.isArray(responseBody.message)) {
        const details = responseBody.message.filter(
          (part): part is string => typeof part === "string",
        );
        if (details.length > 0) {
          message = details.join(" ");
        }
      }
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getPromotions(signal: AbortSignal) {
  return fetchJson<Promotion[]>("/promotions/me", signal);
}

export function validatePromotion(code: string, items: CartValidationInputItem[]) {
  return postJson<PromotionValidation>("/promotions/validate", { code, items });
}

export function validateCart(items: CartValidationInputItem[]) {
  return postJson<CartValidationResult>("/cart/validate", { items });
}

export function submitPayment(
  payload: PaymentRequest,
  signal?: AbortSignal
): Promise<PaymentResponse> {
  return postJson<PaymentResponse>(
    "/payments",
    {
      orderId: payload.orderId,
      method: payload.method === "E_WALLET" ? "WALLET" : payload.method,
      idempotencyKey: crypto.randomUUID(),
    },
    signal,
  );
}
