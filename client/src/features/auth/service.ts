import type {
  AuthenticatedUser,
  ChangePasswordInput,
  LoginInput,
} from "./types";

// ========================
// HTTP CLIENT
// ========================

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include", // gửi/nhận httpOnly cookie tự động
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.message ?? "Yêu cầu tới máy chủ thất bại.");
  }

  return payload as T;
}

// ========================
// AUTH SERVICE
// ========================

interface ApiOk<T> {
  status: string;
  data: T;
}

/**
 * Đăng nhập thống nhất — mọi role dùng chung endpoint /api/auth/login
 * Server set httpOnly cookie, không lưu gì vào localStorage
 */
export async function loginWithServer(input: LoginInput): Promise<AuthenticatedUser> {
  const res = await apiRequest<ApiOk<{ user: AuthenticatedUser }>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data.user;
}

/**
 * Lấy profile user hiện tại — dựa vào access-token cookie
 */
export async function fetchCurrentUser(): Promise<AuthenticatedUser> {
  const res = await apiRequest<ApiOk<{ user: AuthenticatedUser }>>("/api/auth/me");
  return res.data.user;
}

/**
 * Dùng refresh-token cookie để lấy access-token mới
 */
export async function refreshSession(): Promise<AuthenticatedUser> {
  const res = await apiRequest<ApiOk<{ user: AuthenticatedUser }>>("/api/auth/refresh", {
    method: "POST",
  });
  return res.data.user;
}

/**
 * Đăng xuất — server xóa cookie + revoke session
 */
export async function logoutFromServer(): Promise<void> {
  await apiRequest<ApiOk<{ message: string }>>("/api/auth/logout", {
    method: "POST",
  });
}

/**
 * Đổi mật khẩu (dành cho lần đầu đăng nhập hoặc tự nguyện)
 */
export async function changePasswordOnServer(input: ChangePasswordInput): Promise<void> {
  await apiRequest<ApiOk<{ message: string }>>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
