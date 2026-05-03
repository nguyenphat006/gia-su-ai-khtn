import { apiClient } from "@/lib/apiClient";

export const adminClassService = {
  getClasses: async (params?: { page?: number; limit?: number; search?: string; grade?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<any>(`/api/classes?${query}`);
  },

  getClassDetail: async (id: string) => {
    return apiClient<any>(`/api/classes/${id}`);
  },

  createClass: async (data: any) => {
    return apiClient<any>("/api/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateClass: async (id: string, data: any) => {
    return apiClient<any>(`/api/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteClasses: async (ids: string[]) => {
    return apiClient<any>("/api/classes", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },
};
