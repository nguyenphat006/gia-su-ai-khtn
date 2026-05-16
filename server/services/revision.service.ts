import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import * as geminiService from "./gemini.service.js";
import { retrieveRelevantContext } from "./knowledge.service.js";
import { addXp, updateChallengeProgress } from "./gamification.service.js";
import { XpAction } from "@prisma/client";

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

  // Retrieve relevant context from Knowledge Base - Lọc theo grade
  const gradeNum = parseInt(grade.replace(/\D/g, ""));
  const context = await retrieveRelevantContext(`${grade} ${topic}`, 5, isNaN(gradeNum) ? undefined : gradeNum);

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
    const context = await retrieveRelevantContext(`${grade} ${topic}`, 5, grade);
    const aiResult = await geminiService.generateQuiz(
      topic, 
      context, 
      `Lớp ${grade}`, 
      type || "Trắc nghiệm", 
      limit - bankQuestions.length
    );

    if (aiResult && aiResult.quizzes) {
      // Map AI format to Bank format for frontend consistency
      const aiQuestionsData = aiResult.quizzes.map((q: any) => ({
        content: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || (q.options ? q.options[q.answerIndex] : ""),
        explanation: q.explanation || "",
        difficulty: q.difficulty || "Trung bình",
        type: q.isEssay ? "ESSAY" : "MULTIPLE_CHOICE",
        topic: topic,
        grade: grade,
        isActive: true,
        status: "APPROVED"
      }));

      // Tự động lưu vào ngân hàng câu hỏi
      try {
        await prisma.questionBank.createMany({
          data: aiQuestionsData
        });
      } catch (err) {
        console.error("Lỗi khi lưu câu hỏi AI vào ngân hàng:", err);
      }

      // Trả về kết quả (cần ID cho frontend nên ta map lại một lần nữa hoặc lấy từ DB vừa lưu)
      // Để nhanh, ta map thủ công và gán ID giả như cũ hoặc truy vấn lại
      const finalAiQuestions = aiQuestionsData.map((q: any) => ({
        ...q,
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        isAiGenerated: true
      }));

      return [...bankQuestions, ...finalAiQuestions];
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
    const context = await retrieveRelevantContext(`${grade} ${topic}`, 5, grade);
    const aiResult = await geminiService.generateFlashcards(topic, context, `Lớp ${grade}`);
    
    if (aiResult && aiResult.flashcards) {
      // Tự động lưu vào ngân hàng Flashcard
      try {
        const newDeck = await prisma.flashcardDeck.create({
          data: {
            title: `Flashcard: ${topic}`,
            topic,
            grade,
            cards: aiResult.flashcards,
            isActive: true
          }
        });
        return {
          ...newDeck,
          isAiGenerated: true
        };
      } catch (err) {
        console.error("Lỗi khi lưu bộ Flashcard AI vào ngân hàng:", err);
        // Fallback trả về object AI nếu lưu lỗi
        return {
          id: "ai-generated",
          title: `Flashcard: ${topic}`,
          topic,
          grade,
          cards: aiResult.flashcards,
          isAiGenerated: true
        };
      }
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
    const context = await retrieveRelevantContext(`${grade} ${topic}`, 5, grade);
    const aiResult = await geminiService.generateMindmap(topic, context, `Lớp ${grade}`);
    
    if (aiResult && aiResult.mindmap) {
      // Tự động lưu vào ngân hàng Mindmap
      try {
        const newMindmap = await prisma.mindmapData.create({
          data: {
            title: `Sơ đồ tư duy: ${topic}`,
            topic,
            grade,
            markdown: JSON.stringify(aiResult.mindmap),
            isActive: true
          }
        });
        return {
          ...newMindmap,
          nodes: aiResult.mindmap,
          isAiGenerated: true
        };
      } catch (err) {
        console.error("Lỗi khi lưu sơ đồ tư duy AI vào ngân hàng:", err);
        return {
          id: "ai-generated",
          title: `Sơ đồ tư duy: ${topic}`,
          topic,
          grade,
          nodes: aiResult.mindmap,
          isAiGenerated: true
        };
      }
    }
    throw new NotFoundError("Không thể tạo sơ đồ tư duy cho chủ đề này.");
  }

  let nodes = [];
  try {
    nodes = JSON.parse(mindmap.markdown);
  } catch (e) {
    console.error("Lỗi parse markdown mindmap từ DB:", e);
  }

  return {
    ...mindmap,
    nodes
  };
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

    // 2. Update User Stats & Log XP via Gamification Service
    await addXp(data.userId, xpEarned, XpAction.COMPLETE_QUIZ, history.id, tx);

    // 3. Update Challenges
    if (data.quizType === "FLASHCARD_QUIZ") {
      await updateChallengeProgress(data.userId, "CHIEN_BINH_DA_TAI", 1);
    } else {
      await updateChallengeProgress(data.userId, "CHIEN_BINH_TRI_TUE", 1);
    }

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

/**
 * 7. STUDENT HISTORY: Get personal quiz history
 */
export async function getStudentHistory(userId: string, limit = 20) {
  return await prisma.quizHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}
