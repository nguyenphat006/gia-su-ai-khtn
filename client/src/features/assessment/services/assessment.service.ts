import { apiClient } from "@/lib/apiClient";
import { 
  Quiz, 
  FlashcardDeck, 
  MindmapData, 
  QuizHistory 
} from "../types";

export const assessmentService = {
  // Sinh bộ câu hỏi (Hybrid: Bank + AI)
  generateQuiz: async (params: { grade: number; topic: string; limit?: number }) => {
    return apiClient<{ status: string; data: { questions: Quiz[] } }>("/api/revision/quiz/generate", {
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
    return apiClient<{ status: string; data: { history: QuizHistory; xpEarned: number } }>("/api/revision/quiz/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Lấy bộ Flashcard
  getFlashcards: async (grade: number, topic: string) => {
    return apiClient<{ status: string; data: FlashcardDeck }>("/api/revision/flashcards/get", {
      method: "POST",
      body: JSON.stringify({ grade, topic }),
    });
  },

  // Lấy Mindmap
  getMindmap: async (grade: number, topic: string) => {
    return apiClient<{ status: string; data: MindmapData }>("/api/revision/mindmap/get", {
      method: "POST",
      body: JSON.stringify({ grade, topic }),
    });
  },
};
