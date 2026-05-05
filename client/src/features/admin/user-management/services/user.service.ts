import { apiClient } from "@/lib/apiClient";

const BASE_URL =
  typeof import.meta !== "undefined" && import.meta.env?.DEV
    ? ""
    : import.meta.env?.VITE_API_URL || "https://giasu-ai-khtn-api.onrender.com";

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
  importFromExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    // apiClient ko handle FormData tốt nên gọi fetch trực tiếp
    const { apiClient: _ac, ...rest } = await import("@/lib/apiClient");
    const url = `${BASE_URL}/api/users/import-excel`;

    // Lấy token từ localStorage nếu có
    const accessToken = localStorage.getItem("accessToken");
    const headers: HeadersInit = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? `Import thất bại (${response.status})`);
    }
    return payload;
  },

  /**
   * Tải file Excel mẫu hoặc Xuất danh sách người dùng
   */
  exportToExcel: async (params?: { role?: string; classId?: string; search?: string; template?: boolean }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    const url = `${BASE_URL}/api/users/export-excel${query ? `?${query}` : ""}`;

    const accessToken = localStorage.getItem("accessToken");
    const headers: HeadersInit = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const response = await fetch(url, { headers, credentials: "include" });
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
  importFromJson: async (users: any[]) => {
    return apiClient<any>("/api/users/batch-import", {
      method: "POST",
      body: JSON.stringify({ users }),
    });
  },

  /**
   * Sinh dữ liệu học sinh giả lập bằng AI Gemini
   */
  generateMockUsers: async (data: { count: number; classId?: string; grade?: number; saveToDb?: boolean }) => {
    return apiClient<any>("/api/users/generate-mock", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
