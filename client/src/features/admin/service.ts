const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const adminService = {
  // System Configs
  getConfig: async (key: string) => {
    const res = await fetch(`${API_URL}/system/configs/${key}`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.config;
  },
  
  updateConfig: async (key: string, value: string) => {
    const res = await fetch(`${API_URL}/system/configs/${key}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ value }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.config;
  },

  // Knowledge Base
  getDocuments: async () => {
    const res = await fetch(`${API_URL}/knowledge`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.documents;
  },

  createDocument: async (title: string, content: string, tags: string[] = []) => {
    const res = await fetch(`${API_URL}/knowledge`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, content, tags }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.document;
  },

  deleteDocument: async (id: string) => {
    const res = await fetch(`${API_URL}/knowledge/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.status === "success";
  },
};
