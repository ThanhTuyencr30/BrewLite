import type {
  Category,
  Product,
  LoginRequest,
  LoginResponse,
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

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

async function sendJson<T>(
  path: string,
  data: unknown,
  errorMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

export function getCategories(signal: AbortSignal) {
  return fetchJson<Category[]>("/categories", signal);
}

export function getProducts(
  filters: { search: string; category: string },
  signal: AbortSignal,
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
export function register(
  data: RegisterRequest,
  signal?: AbortSignal,
): Promise<User> {
  return sendJson(
    "/auth/register",
    data,
    "Unable to create your account.",
    signal,
  );
}

export function login(
  data: LoginRequest,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  return sendJson(
    "/auth/login",
    data,
    "Email hoặc mật khẩu không đúng.",
    signal,
  );
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
