export type AssessmentMode = "menu" | "quiz" | "chat" | "history" | "flashcard" | "mindmap";

export interface Quiz {
  id?: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  hint?: string;
  difficulty?: string;
  type?: "MULTIPLE_CHOICE" | "ESSAY";
  isAiGenerated?: boolean;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  grade: number;
  cards: Flashcard[];
  isAiGenerated?: boolean;
}

export interface MindmapNode {
  id: string;
  label: string;
  parentId: string | null;
}

export interface MindmapData {
  id: string;
  title: string;
  topic: string;
  grade: number;
  nodes: MindmapNode[];
  isAiGenerated?: boolean;
}

export interface QuizHistory {
  id: string;
  userId: string;
  quizType: string;
  totalQuestions: number;
  correctCount: number;
  xpEarned: number;
  createdAt: string;
}

export interface EssayFeedback {
  isPassing: boolean;
  feedback: string;
  score: number;
}
