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

function buildQueryString(params?: any) {
  if (!params) return "";
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  return new URLSearchParams(cleaned as any).toString();
}

export const adminRevisionService = {
  // 1. NGÂN HÀNG CÂU HỎI (QUIZ)
  getQuestions: async (params?: { grade?: number; topic?: string; difficulty?: string }) => {
    const query = buildQueryString(params);
    return request<{ status: string; data: { questions: any[] } }>(`/api/revision/questions?${query}`);
  },

  createQuestion: async (data: any) => {
    return request<{ status: string; data: { question: any } }>("/api/revision/questions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteQuestions: async (ids: string[]) => {
    return request<{ status: string; message: string }>("/api/revision/questions", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  // 2. BỘ FLASHCARDS
  getFlashcards: async (params?: { grade?: number; topic?: string }) => {
    const query = buildQueryString(params);
    return request<{ status: string; data: { decks: any[] } }>(`/api/revision/flashcards?${query}`);
  },

  createFlashcard: async (data: any) => {
    return request<{ status: string; data: { deck: any } }>("/api/revision/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteFlashcards: async (ids: string[]) => {
    return request<{ status: string; message: string }>("/api/revision/flashcards", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  // 3. SƠ ĐỒ TƯ DUY (MINDMAP)
  getMindmaps: async (params?: { grade?: number; topic?: string }) => {
    const query = buildQueryString(params);
    return request<{ status: string; data: { mindmaps: any[] } }>(`/api/revision/mindmaps?${query}`);
  },

  createMindmap: async (data: any) => {
    return request<{ status: string; data: { mindmap: any } }>("/api/revision/mindmaps", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteMindmaps: async (ids: string[]) => {
    return request<{ status: string; message: string }>("/api/revision/mindmaps", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  // 4. AI DRAFT GENERATION
  generateDraft: async (params: { 
    type: "QUIZ" | "FLASHCARD" | "MINDMAP"; 
    grade: number; 
    topic: string; 
    count?: number 
  }) => {
    return request<{ status: string; data: any }>("/api/revision/admin/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
};
