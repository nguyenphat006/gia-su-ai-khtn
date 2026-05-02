/**
 * Centralized API Client with automatic token refresh handling.
 * Uses native fetch with HttpOnly cookies.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "https://giasu-ai-khtn-api.onrender.com";

// To track if a refresh is already in progress to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token?: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token?: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.map((cb) => cb());
  refreshSubscribers = [];
}

/**
 * Robust fetch wrapper that handles 401 Unauthorized by attempting to refresh the token.
 */
export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const requestOptions: RequestInit = {
    ...init,
    headers,
    credentials: "include", // Essential for HttpOnly cookies
  };

  const response = await fetch(url, requestOptions);

  // If unauthorized (401), attempt to refresh
  if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          onRefreshed();
          // Retry the original request
          return apiClient(path, init);
        } else {
          // Refresh failed
          isRefreshing = false;
          handleGlobalLogout();
          throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
        }
      } catch (err) {
        isRefreshing = false;
        handleGlobalLogout();
        throw err;
      }
    }

    // If a refresh is already in progress, wait for it to complete
    return new Promise((resolve) => {
      subscribeTokenRefresh(() => {
        resolve(apiClient(path, init));
      });
    });
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message ?? "Yêu cầu tới máy chủ thất bại.");
    (error as any).status = response.status;
    (error as any).data = payload;
    throw error;
  }

  return payload as T;
}

/**
 * Forces a logout and redirects to login page.
 */
function handleGlobalLogout() {
  // Clear any local state if necessary (cookies are cleared by server on /logout)
  // For now, we force a hard reload/redirect to ensure all state is reset
  if (typeof window !== "undefined") {
    // We can't use useNavigate here as it's not a component
    // but we can trigger a redirect
    window.location.href = "/";
  }
}
