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

export async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    if (response.headers.get("content-type")?.includes("application/json")) {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body
      ) {
        if (typeof body.message === "string") {
          message = body.message;
        } else if (
          Array.isArray(body.message) &&
          body.message.every((item): item is string => typeof item === "string")
        ) {
          message = body.message.join(", ");
        }
      }
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getCategories(signal: AbortSignal) {
  return fetchJson<Category[]>("/categories", { signal });
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
  return fetchJson<Product[]>(`/products${query ? `?${query}` : ""}`, {
    signal,
  });
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
  return fetchJson<Promotion[]>("/promotions/me", { signal });
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
