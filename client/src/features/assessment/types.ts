import { Timestamp } from "firebase/firestore";

export type AssessmentMode = "menu" | "quiz" | "chat" | "history" | "flashcard" | "mindmap";

export interface Quiz {
  question: string;
  options?: string[]; // Optional for essay
  answerIndex?: number; // Optional for essay
  explanation: string;
  hint?: string;
  difficulty?: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface MindmapNode {
  id: string;
  label: string;
  parentId: string | null;
}

export interface QuizHistory {
  id: string;
  topic: string;
  score: number;
  total: number;
  createdAt: Timestamp | null;
  performance?: any;
}

export interface EssayFeedback {
  isPassing: boolean;
  feedback: string;
  score: number;
}
