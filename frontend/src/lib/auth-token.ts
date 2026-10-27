const ACCESS_TOKEN_KEY = "accessToken";

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Trình duyệt chặn localStorage: không còn token nào để xóa.
  }
}

export function loginUrl(nextPath: string) {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}
