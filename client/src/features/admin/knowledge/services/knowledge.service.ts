import { KnowledgeListResponse } from "./types";
import { apiClient } from "@/lib/apiClient";

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

    return apiClient<KnowledgeListResponse>(`/api/knowledge?${query.toString()}`);
  },

  deleteDocuments: async (ids: string[]) => {
    return apiClient("/api/knowledge", {
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
    return apiClient("/api/knowledge", {
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
    return apiClient(`/api/knowledge/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
