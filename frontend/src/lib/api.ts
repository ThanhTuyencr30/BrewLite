import type {
  CartValidationResult,
  CartValidationInputItem,
  Category,
  CreateOrderRequest,
  LoginRequest,
  LoginResponse,
  Order,
  PaymentRequest,
  PaymentResponse,
  Product,
  Promotion,
  PromotionValidation,
  RegisterRequest,
  User,
} from "./api.types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
    throw new ApiError(
      await readErrorMessage(response),
      response.status,
    );
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

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readErrorMessage(response: Response) {
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
  return message;
}

async function getJsonWithAuth<T>(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json", ...authHeaders(token) },
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
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
  token: string,
  signal?: AbortSignal
): Promise<PaymentResponse> {
  return postJson<PaymentResponse>(
    "/payments",
    {
      orderId: payload.orderId,
      method: payload.method === "E_WALLET" ? "WALLET" : payload.method,
      idempotencyKey: crypto.randomUUID(),
      ...(payload.cardNumber && { cardNumber: payload.cardNumber }),
    },
    signal,
    token,
  );
}

export function confirmQrPayment(paymentId: string, token: string) {
  return postJson<PaymentResponse>(`/payments/${paymentId}/confirm`, {}, undefined, token);
}

export function register(data: RegisterRequest, signal?: AbortSignal) {
  return postJson<User>("/auth/register", data, signal);
}

export function login(data: LoginRequest, signal?: AbortSignal) {
  return postJson<LoginResponse>("/auth/login", data, signal);
}

export async function getMe(
  token: string,
  signal?: AbortSignal,
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status === 401
        ? "Your session has expired."
        : "Unable to load your account.",
      response.status,
    );
  }

  return response.json() as Promise<User>;
}

export function createOrder(data: CreateOrderRequest, token: string) {
  return postJson<Order>("/orders", data, undefined, token);
}

export function getOrder(id: string, token: string, signal?: AbortSignal) {
  return getJsonWithAuth<Order>(`/orders/${id}`, token, signal);
}

export function cancelOrder(id: string, token: string) {
  return postJson<{ message: string; orderId: string }>(
    `/orders/${id}/cancel`,
    {},
    undefined,
    token,
  );
}
