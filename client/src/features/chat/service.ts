import { apiClient } from "@/lib/apiClient";

export const chatService = {
  // Lấy danh sách session
  getSessions: async () => {
    const json = await apiClient<any>("/api/chat/sessions");
    return json.data.sessions;
  },

  // Tạo session mới
  createSession: async (title: string) => {
    const json = await apiClient<any>("/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    return json.data.session;
  },

  // Lấy tin nhắn trong session
  getMessages: async (sessionId: string) => {
    const json = await apiClient<any>(`/api/chat/sessions/${sessionId}/messages`);
    return json.data.messages;
  },

  // Gửi tin nhắn
  sendMessage: async (sessionId: string, content: string, imageBase64?: string, mimeType?: string) => {
    const json = await apiClient<any>(`/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, imageBase64, mimeType }),
    });
    return json.data; // { userMessage, aiMessage }
  },

  // Xóa session
  deleteSession: async (sessionId: string) => {
    await apiClient<any>(`/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },
};
