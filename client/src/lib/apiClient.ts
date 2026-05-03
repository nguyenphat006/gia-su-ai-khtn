/**
 * Centralized API Client with automatic token refresh handling.
 * Uses native fetch with HttpOnly cookies.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "https://giasu-ai-khtn-api.onrender.com";

// To track if a refresh is already in progress to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers: ((error?: Error) => void)[] = [];

function subscribeTokenRefresh(cb: (error?: Error) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(error?: Error) {
  refreshSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
}

/**
 * Robust fetch wrapper that handles 401 Unauthorized by attempting to refresh the token.
 */
export async function apiClient<T>(path: string, init?: RequestInit, _isRetry = false): Promise<T> {
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

  try {
    const response = await fetch(url, requestOptions);

    // If unauthorized (401), attempt to refresh
    // Don't refresh if it's already a login/refresh request or if we've already retried
    if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/refresh") && !_isRetry) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          console.log("[apiClient] Token expired, attempting refresh...");
          const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (refreshRes.ok) {
            console.log("[apiClient] Refresh success, retrying request.");
            isRefreshing = false;
            onRefreshed();
            return apiClient(path, init, true); // Mark as retry
          } else {
            console.warn("[apiClient] Refresh failed.");
            isRefreshing = false;
            const error = new Error("Phiên làm việc hết hạn.");
            onRefreshed(error);
            handleGlobalLogout();
            throw error;
          }
        } catch (err) {
          isRefreshing = false;
          const error = err instanceof Error ? err : new Error(String(err));
          onRefreshed(error);
          handleGlobalLogout();
          throw error;
        }
      }

      // If a refresh is already in progress, wait for it to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(apiClient(path, init, true));
          }
        });
      });
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(payload?.message ?? `Yêu cầu thất bại (${response.status})`);
      (error as any).status = response.status;
      (error as any).data = payload;
      throw error;
    }

    return payload as T;
  } catch (err) {
    if (err instanceof Error && (err as any).status === 401) throw err;
    
    // Handle network errors or other fetch failures
    console.error("[apiClient] Request Error:", err);
    throw err;
  }
}

/**
 * Forces a logout and redirects to login page.
 */
function handleGlobalLogout() {
  if (typeof window !== "undefined") {
    // Detect if we are in local environment
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    // Only redirect if we are not already on the login/root page
    // For local dev, we might want to be more direct
    if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
      window.location.href = "/";
    } else if (isLocal) {
        // If we are at root in local and auth failed, ensure we aren't showing a stale state
        // (Though useAuth should handle this by setting user to null)
        console.log("[apiClient] Auth failed at root (local).");
    }
  }
}
