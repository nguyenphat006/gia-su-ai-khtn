import { getStoredAccessToken } from "@/lib/auth";
import { 
  Quiz, 
  FlashcardDeck, 
  MindmapData, 
  QuizHistory 
} from "../types";

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

export const assessmentService = {
  // Sinh bộ câu hỏi (Hybrid: Bank + AI)
  generateQuiz: async (params: { grade: number; topic: string; limit?: number }) => {
    return request<{ status: string; data: { questions: Quiz[] } }>("/api/revision/quiz/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Nộp kết quả bài làm
  submitQuizResult: async (data: { 
    quizType: string; 
    totalQuestions: number; 
    correctCount: number 
  }) => {
    return request<{ status: string; data: { history: QuizHistory; xpEarned: number } }>("/api/revision/quiz/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Lấy bộ Flashcard
  getFlashcards: async (grade: number, topic: string) => {
    return request<{ status: string; data: FlashcardDeck }>("/api/revision/flashcards/get", {
      method: "POST",
      body: JSON.stringify({ grade, topic }),
    });
  },

  // Lấy Mindmap
  getMindmap: async (grade: number, topic: string) => {
    return request<{ status: string; data: MindmapData }>("/api/revision/mindmap/get", {
      method: "POST",
      body: JSON.stringify({ grade, topic }),
    });
  },

  // Lấy lịch sử (Nếu backend có endpoint này, hiện tại controller chưa thấy rõ endpoint riêng cho student history, có thể dùng getQuizHistory nếu có)
  // Trong plan chưa ghi rõ API lấy lịch sử cho Student, tôi sẽ tạm giả định endpoint /api/revision/history nếu cần sau này.
};
