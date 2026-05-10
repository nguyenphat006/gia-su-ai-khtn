import { apiClient } from "@/lib/apiClient";

export const adminUserService = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    classId?: string;
    status?: string;
  }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const query = new URLSearchParams(cleanParams as any).toString();
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

  getUserDetail: async (id: string) => {
    return apiClient<any>(`/api/users/${id}`);
  },

  deleteUsers: async (ids: string[]) => {
    return apiClient<any>("/api/users", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  /**
   * Upload file Excel để import danh sách người dùng
   */
  importFromExcel: async (file: File, options?: { grade?: string; seedActivity?: boolean; seedOptions?: any }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.grade) formData.append("grade", options.grade);
    if (options?.seedActivity) formData.append("seedActivity", "true");
    if (options?.seedOptions) formData.append("seedOptions", JSON.stringify(options.seedOptions));

    return apiClient<any>("/api/users/import-excel", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Tải file Excel mẫu hoặc Xuất danh sách người dùng
   */
  exportToExcel: async (params?: { role?: string; classId?: string; search?: string; template?: boolean }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    const url = `/api/users/export-excel${query ? `?${query}` : ""}`;

    // Đối với export file, dùng fetch trực tiếp để lấy blob nhưng vẫn đảm bảo cookie
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message ?? "Xuất file thất bại");
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Import danh sách user từ JSON array (dùng sau khi AI preview)
   */
  importFromJson: async (users: any[], seedActivity = true, seedOptions?: any) => {
    return apiClient<any>("/api/users/batch-import", {
      method: "POST",
      body: JSON.stringify({ users, seedActivity, seedOptions }),
    });
  },

  /**
   * Sinh dữ liệu học sinh giả lập bằng AI Gemini
   */
  generateMockUsers: async (data: { count: number; classId?: string; grade?: number; saveToDb?: boolean; seedActivity?: boolean, seedOptions?: any }) => {
    return apiClient<any>("/api/users/generate-mock", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
