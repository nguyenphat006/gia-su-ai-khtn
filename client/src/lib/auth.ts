export interface LoginInput {
  identifier: string;
  password: string;
}

export interface ActivateAccountInput {
  identifier: string;
  activationCode: string;
  password: string;
  displayName?: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  status: "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  mustChangePassword: boolean;
  class: {
    id: string;
    code: string;
    name: string;
    grade: number;
    academicYear: string;
  } | null;
  studentProfile: {
    studentCode: string;
    grade: number;
    avatarUrl: string | null;
  } | null;
  teacherProfile: {
    employeeCode: string | null;
    subject: string | null;
    avatarUrl: string | null;
  } | null;
}

interface AuthResponse {
  status: string;
  data: {
    user: AuthenticatedUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresInSeconds: number;
    };
  };
}

const ACCESS_TOKEN_KEY = "gia_su_ai_access_token";
const REFRESH_TOKEN_KEY = "gia_su_ai_refresh_token";

function saveAuthSession(response: AuthResponse["data"]) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refreshToken);
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getStoredAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Yêu cầu tới máy chủ không thành công.");
  }

  return payload as T;
}

function handleAuthSuccess(response: AuthResponse) {
  saveAuthSession(response.data);
  return response.data;
}

export async function loginStudentWithServer(input: LoginInput) {
  const response = await request<AuthResponse>("/api/auth/student/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return handleAuthSuccess(response);
}

export async function loginTeacherWithServer(input: LoginInput) {
  const response = await request<AuthResponse>("/api/auth/teacher/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return handleAuthSuccess(response);
}

export async function activateFirstTimeAccount(input: ActivateAccountInput) {
  const response = await request<AuthResponse>("/api/auth/activate", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return handleAuthSuccess(response);
}

export async function refreshSessionWithServer(refreshToken?: string) {
  const token = refreshToken || getStoredRefreshToken();
  if (!token) {
    throw new Error("Không tìm thấy refresh token.");
  }

  const response = await request<AuthResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
  });

  return handleAuthSuccess(response);
}

export async function logoutFromServer() {
  try {
    await request<{ status: string; data: { message: string } }>("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAuthSession();
  }
}
