import { apiClient } from "@/lib/apiClient";

export const adminService = {
  // System Configs
  getConfig: async (key: string) => {
    const json = await apiClient<any>(`/api/system/configs/${key}`);
    return json.data.config;
  },
  
  updateConfig: async (key: string, value: string) => {
    const json = await apiClient<any>(`/api/system/configs/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    return json.data.config;
  },

  // Knowledge Base
  getDocuments: async () => {
    const json = await apiClient<any>("/api/knowledge");
    return json.data.documents;
  },

  createDocument: async (title: string, content: string, tags: string[] = []) => {
    const json = await apiClient<any>("/api/knowledge", {
      method: "POST",
      body: JSON.stringify({ title, content, tags }),
    });
    return json.data.document;
  },

  deleteDocument: async (id: string) => {
    const json = await apiClient<any>(`/api/knowledge/${id}`, {
      method: "DELETE",
    });
    return json.status === "success";
  },
};
