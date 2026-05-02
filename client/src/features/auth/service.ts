import type {
  AuthenticatedUser,
  ChangePasswordInput,
  LoginInput,
} from "./types";
import { apiClient } from "@/lib/apiClient";

// ========================
// AUTH SERVICE
// ========================

interface ApiOk<T> {
  status: string;
  data: T;
}

/**
 * Đăng nhập thống nhất — mọi role dùng chung endpoint /api/auth/login
 */
export async function loginWithServer(input: LoginInput): Promise<AuthenticatedUser> {
  const res = await apiClient<ApiOk<{ user: AuthenticatedUser }>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data.user;
}

/**
 * Lấy profile user hiện tại — dựa vào access-token cookie
 */
export async function fetchCurrentUser(): Promise<AuthenticatedUser> {
  const res = await apiClient<ApiOk<{ user: AuthenticatedUser }>>("/api/auth/me");
  return res.data.user;
}

/**
 * Dùng refresh-token cookie để lấy access-token mới
 */
export async function refreshSession(): Promise<AuthenticatedUser> {
  const res = await apiClient<ApiOk<{ user: AuthenticatedUser }>>("/api/auth/refresh", {
    method: "POST",
  });
  return res.data.user;
}

/**
 * Đăng xuất — server xóa cookie + revoke session
 */
export async function logoutFromServer(): Promise<void> {
  await apiClient<ApiOk<{ message: string }>>("/api/auth/logout", {
    method: "POST",
  });
}

/**
 * Đổi mật khẩu
 */
export async function changePasswordOnServer(input: ChangePasswordInput): Promise<void> {
  await apiClient<ApiOk<{ message: string }>>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
