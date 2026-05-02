import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import * as geminiService from "./gemini.service.js";
import { retrieveRelevantContext } from "./knowledge.service.js";

/**
 * 1. ADMIN LOGIC: Generate content using AI
 */
export async function generateDraftContent(params: {
  type: "QUIZ" | "FLASHCARD" | "MINDMAP";
  grade: string;
  topic: string;
  count?: number;
}) {
  const { type, grade, topic, count = 5 } = params;

  // Retrieve relevant context from Knowledge Base
  const context = await retrieveRelevantContext(`${grade} ${topic}`, 5);

  if (type === "QUIZ") {
    return geminiService.generateQuiz(topic, context, grade, "Trắc nghiệm", count);
  } else if (type === "FLASHCARD") {
    return geminiService.generateFlashcards(topic, context, grade);
  } else if (type === "MINDMAP") {
    return geminiService.generateMindmap(topic, context, grade);
  }

  throw new Error("Loại nội dung không hợp lệ.");
}

/**
 * 2. STUDENT LOGIC: Get Revision Content (Bank + AI Fallback)
 */
export async function getQuizForStudent(params: {
  grade: number;
  topic: string;
  limit: number;
  type?: string;
}) {
  const { grade, topic, limit, type } = params;

  // Try to get from Bank first
  const whereClause: any = {
    isActive: true,
    grade: grade,
    topic: { contains: topic, mode: "insensitive" }
  };

  if (type && type !== "Trắc nghiệm & Tự luận") {
    whereClause.type = type === "Trắc nghiệm" ? "MULTIPLE_CHOICE" : "ESSAY";
  }

  const bankQuestions = await prisma.questionBank.findMany({
    where: whereClause,
    take: limit
  });

  // If not enough questions, call AI (Hybrid logic)
  if (bankQuestions.length < limit) {
    const context = await retrieveRelevantContext(`${grade} ${topic}`, 5);
    const aiResult = await geminiService.generateQuiz(
      topic, 
      context, 
      `Lớp ${grade}`, 
      type || "Trắc nghiệm", 
      limit - bankQuestions.length
    );

    if (aiResult && aiResult.quizzes) {
      // Map AI format to Bank format for frontend consistency
      const aiQuestions = aiResult.quizzes.map((q: any) => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        content: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || (q.options ? q.options[q.answerIndex] : ""),
        explanation: q.explanation,
        hint: q.hint,
        type: q.isEssay ? "ESSAY" : "MULTIPLE_CHOICE",
        difficulty: q.difficulty,
        topic: topic,
        grade: grade,
        isAiGenerated: true
      }));
      return [...bankQuestions, ...aiQuestions];
    }
  }

  return bankQuestions;
}

/**
 * 3. FLASHCARD LOGIC
 */
export async function getFlashcardsForStudent(params: {
  grade: number;
  topic: string;
}) {
  const { grade, topic } = params;

  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      isActive: true,
      grade: grade,
      topic: { contains: topic, mode: "insensitive" }
    }
  });

  if (!deck) {
    const context = await retrieveRelevantContext(`${grade} ${topic}`, 5);
    const aiResult = await geminiService.generateFlashcards(topic, context, `Lớp ${grade}`);
    
    if (aiResult && aiResult.flashcards) {
      return {
        id: "ai-generated",
        title: `Flashcard: ${topic}`,
        topic,
        grade,
        cards: aiResult.flashcards,
        isAiGenerated: true
      };
    }
    throw new NotFoundError("Không thể tạo flashcard cho chủ đề này.");
  }

  return deck;
}

/**
 * 4. MINDMAP LOGIC
 */
export async function getMindmapForStudent(params: {
  grade: number;
  topic: string;
}) {
  const { grade, topic } = params;

  const mindmap = await prisma.mindmapData.findFirst({
    where: {
      isActive: true,
      grade: grade,
      topic: { contains: topic, mode: "insensitive" }
    }
  });

  if (!mindmap) {
    const context = await retrieveRelevantContext(`${grade} ${topic}`, 5);
    const aiResult = await geminiService.generateMindmap(topic, context, `Lớp ${grade}`);
    
    if (aiResult && aiResult.mindmap) {
      return {
        id: "ai-generated",
        title: `Sơ đồ tư duy: ${topic}`,
        topic,
        grade,
        nodes: aiResult.mindmap, // Assuming gemini service returns { mindmap: [...] }
        isAiGenerated: true
      };
    }
    throw new NotFoundError("Không thể tạo mindmap cho chủ đề này.");
  }

  return mindmap;
}

/**
 * 5. HISTORY & STATS
 */
export async function saveQuizResult(data: {
  userId: string;
  quizType: string;
  totalQuestions: number;
  correctCount: number;
}) {
  const xpEarned = data.correctCount * 10;

  return await prisma.$transaction(async (tx) => {
    // 1. Save History
    const history = await tx.quizHistory.create({
      data: {
        userId: data.userId,
        quizType: data.quizType,
        totalQuestions: data.totalQuestions,
        correctCount: data.correctCount,
        xpEarned
      }
    });

    // 2. Update User Stats
    await tx.userStats.upsert({
      where: { userId: data.userId },
      update: { totalXp: { increment: xpEarned } },
      create: { userId: data.userId, totalXp: xpEarned }
    });

    // 3. Log XP
    await tx.xpLog.create({
      data: {
        userId: data.userId,
        amount: xpEarned,
        action: "COMPLETE_QUIZ",
        referenceId: history.id
      }
    });

    return { history, xpEarned };
  });
}

/**
 * 6. ESSAY EVALUATION
 */
export async function evaluateEssayLogic(params: {
  question: string;
  answer: string;
  image?: { data: string; mimeType: string };
}) {
  return geminiService.evaluateEssay(params.question, params.answer, params.image);
}
