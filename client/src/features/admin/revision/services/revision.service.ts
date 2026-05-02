import { apiClient } from "@/lib/apiClient";

function buildQueryString(params?: any) {
  if (!params) return "";
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  return new URLSearchParams(cleaned as any).toString();
}

export const adminRevisionService = {
  // 1. NGÂN HÀNG CÂU HỎI (QUIZ)
  getQuestions: async (params?: { page?: number; limit?: number; grade?: number; topic?: string; difficulty?: string }) => {
    const query = buildQueryString(params);
    return apiClient<{ status: string; data: { questions: any[]; pagination: any } }>(`/api/revision/questions?${query}`);
  },

  createQuestion: async (data: any) => {
    return apiClient<{ status: string; data: { question: any } }>("/api/revision/questions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateQuestion: async (id: string, data: any) => {
    return apiClient<{ status: string; data: { question: any } }>(`/api/revision/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteQuestions: async (ids: string[]) => {
    return apiClient<{ status: string; message: string }>("/api/revision/questions", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  // 2. BỘ FLASHCARDS
  getFlashcards: async (params?: { page?: number; limit?: number; grade?: number; topic?: string }) => {
    const query = buildQueryString(params);
    return apiClient<{ status: string; data: { decks: any[]; pagination: any } }>(`/api/revision/flashcards?${query}`);
  },

  createFlashcard: async (data: any) => {
    return apiClient<{ status: string; data: { deck: any } }>("/api/revision/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateFlashcard: async (id: string, data: any) => {
    return apiClient<{ status: string; data: { deck: any } }>(`/api/revision/flashcards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteFlashcards: async (ids: string[]) => {
    return apiClient<{ status: string; message: string }>("/api/revision/flashcards", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },

  // 3. SƠ ĐƯỜNG TƯ DUY (MINDMAP)
  getMindmaps: async (params?: { page?: number; limit?: number; grade?: number; topic?: string }) => {
    const query = buildQueryString(params);
    return apiClient<{ status: string; data: { mindmaps: any[]; pagination: any } }>(`/api/revision/mindmaps?${query}`);
  },

  createMindmap: async (data: any) => {
    return apiClient<{ status: string; data: { mindmap: any } }>("/api/revision/mindmaps", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateMindmap: async (id: string, data: any) => {
    return apiClient<{ status: string; data: { mindmap: any } }>(`/api/revision/mindmaps/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteMindmaps: async (ids: string[]) => {
    return apiClient<{ status: string; message: string }>("/api/revision/mindmaps", {
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
    return apiClient<{ status: string; data: any }>("/api/revision/admin/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
};
