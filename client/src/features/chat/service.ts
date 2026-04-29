import { Message } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const chatService = {
  // Lấy danh sách session
  getSessions: async () => {
    const res = await fetch(`${API_URL}/chat/sessions`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.sessions;
  },

  // Tạo session mới
  createSession: async (title: string) => {
    const res = await fetch(`${API_URL}/chat/sessions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.session;
  },

  // Lấy tin nhắn của session
  getMessages: async (sessionId: string) => {
    const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data.messages;
  },

  // Gửi tin nhắn mới
  sendMessage: async (sessionId: string, content: string, imageBase64?: string, mimeType?: string) => {
    const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, imageBase64, mimeType }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.data;
  },
};
