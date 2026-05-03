import { apiClient } from "@/lib/apiClient";

export const adminUserService = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; classId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<any>(`/api/users?${query}`);
  },

  createUser: async (data: any) => {
    return apiClient<any>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateUser: async (id: string, data: any) => {
    return apiClient<any>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteUsers: async (ids: string[]) => {
    return apiClient<any>("/api/users", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },
};
