import { apiClient } from "@/lib/apiClient";

function buildQueryString(params?: any) {
  if (!params) return "";
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  return new URLSearchParams(cleaned as any).toString();
}

export const systemService = {
  getConfigs: async (params?: { page?: number; limit?: number }) => {
    const query = buildQueryString(params);
    return apiClient<{ status: string; data: { configs: any[]; pagination: any } }>(`/api/system/configs?${query}`);
  },

  createConfig: async (key: string, value: string) => {
    return apiClient<any>("/api/system/configs", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
  },

  updateConfig: async (key: string, value: string) => {
    return apiClient<any>(`/api/system/configs/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },

  deleteConfigs: async (keys: string[]) => {
    return apiClient<{ status: "ok"; data: { message: string } }>("/api/system/configs", {
      method: "DELETE",
      body: JSON.stringify({ keys }),
    });
  },
};
