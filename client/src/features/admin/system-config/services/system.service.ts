import { SystemConfigListResponse, SystemConfigResponse } from "../types";
import { getStoredAccessToken } from "@/lib/auth";

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

export const systemService = {
  getConfigs: async () => {
    return request<SystemConfigListResponse>("/api/system/configs");
  },

  createConfig: async (key: string, value: string) => {
    return request<SystemConfigResponse>("/api/system/configs", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
  },

  updateConfig: async (key: string, value: string) => {
    return request<SystemConfigResponse>(`/api/system/configs/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },

  deleteConfigs: async (keys: string[]) => {
    return request<{ status: "ok"; data: { message: string } }>("/api/system/configs", {
      method: "DELETE",
      body: JSON.stringify({ keys }),
    });
  },
};
