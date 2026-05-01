import { KnowledgeListResponse } from "./types";
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

export const knowledgeService = {
  getDocuments: async (params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    active?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.search) query.append("search", params.search);
    if (params.active !== undefined) query.append("active", params.active.toString());

    return request<KnowledgeListResponse>(`/api/knowledge?${query.toString()}`);
  },

  deleteDocuments: async (ids: string[]) => {
    return request("/api/knowledge", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  createDocument: async (data: {
    title: string;
    content: string;
    tags?: string[];
    isActive?: boolean;
  }) => {
    return request("/api/knowledge", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDocument: async (id: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
    isActive?: boolean;
  }) => {
    return request(`/api/knowledge/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
