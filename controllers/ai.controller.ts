import { Request, Response, NextFunction } from "express";
import {
  askGiaSu,
  generateQuiz,
  generateFlashcards,
  generateMindmap,
  analyzePerformance,
  evaluateEssay,
  getRelevantContext,
} from "../services/gemini.service.js";
import { asyncHandler } from "../middleware/error-handler.js";

/**
 * POST /api/ai/chat
 * Chat với Gia sư AI
 */
export const chatWithAI = asyncHandler(
  async (req: Request, res: Response) => {
    const { message, history = [], context, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ status: "error", message: "Thiếu nội dung tin nhắn hoặc hình ảnh." });
    }

    // Nếu FE không truyền context, tự tìm từ Knowledge Base
    const finalContext = context || (await getRelevantContext(message || ""));

    const reply = await askGiaSu(message, history, finalContext, image);
    res.json({ status: "ok", data: { reply } });
  }
);

/**
 * POST /api/ai/quiz
 * Tạo bộ câu hỏi quiz
 */
export const createQuiz = asyncHandler(
  async (req: Request, res: Response) => {
    const { topic, context = "", grade, type, count } = req.body;

    if (!topic) {
      return res.status(400).json({ status: "error", message: "Thiếu chủ đề (topic)." });
    }

    const finalContext = context || (await getRelevantContext(topic));
    const result = await generateQuiz(topic, finalContext, grade, type, count);
    res.json({ status: "ok", data: result });
  }
);

/**
 * POST /api/ai/flashcards
 * Tạo bộ Flashcards
 */
export const createFlashcards = asyncHandler(
  async (req: Request, res: Response) => {
    const { topic, context = "", grade } = req.body;

    if (!topic || !grade) {
      return res.status(400).json({ status: "error", message: "Thiếu chủ đề hoặc khối lớp." });
    }

    const finalContext = context || (await getRelevantContext(topic));
    const result = await generateFlashcards(topic, finalContext, grade);
    res.json({ status: "ok", data: result });
  }
);

/**
 * POST /api/ai/mindmap
 * Tạo Mindmap
 */
export const createMindmap = asyncHandler(
  async (req: Request, res: Response) => {
    const { topic, context = "", grade } = req.body;

    if (!topic || !grade) {
      return res.status(400).json({ status: "error", message: "Thiếu chủ đề hoặc khối lớp." });
    }

    const finalContext = context || (await getRelevantContext(topic));
    const result = await generateMindmap(topic, finalContext, grade);
    res.json({ status: "ok", data: result });
  }
);

/**
 * POST /api/ai/analyze
 * Phân tích kết quả bài làm
 */
export const analyzeResult = asyncHandler(
  async (req: Request, res: Response) => {
    const { topic, results, context = "" } = req.body;

    if (!topic || !results) {
      return res.status(400).json({ status: "error", message: "Thiếu dữ liệu phân tích." });
    }

    const finalContext = context || (await getRelevantContext(topic));
    const result = await analyzePerformance(topic, results, finalContext);
    res.json({ status: "ok", data: result });
  }
);

/**
 * POST /api/ai/evaluate-essay
 * Chấm bài tự luận
 */
export const evaluateEssayAnswer = asyncHandler(
  async (req: Request, res: Response) => {
    const { question, answer, image } = req.body;

    if (!question) {
      return res.status(400).json({ status: "error", message: "Thiếu câu hỏi." });
    }

    const result = await evaluateEssay(question, answer, image);
    res.json({ status: "ok", data: result });
  }
);
