import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import {
  generateArenaQuiz,
  saveArenaResult,
  getLeaderboard,
  getUserArenaStats,
  analyzeArenaPerformance,
} from "../services/arena.service.js";
import { ValidationError } from "../utils/errors.js";

/**
 * POST /api/arena/generate-quiz — AI tạo câu hỏi cho trận đấu
 */
export const generateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { classId, grade, topic, type, difficulty, count } = req.body;

  if (!topic || !topic.trim()) {
    throw new ValidationError("Chủ đề (topic) là bắt buộc.");
  }

  if (count && (count < 1 || count > 20)) {
    throw new ValidationError("Số câu hỏi phải từ 1 đến 20.");
  }

  const result = await generateArenaQuiz({
    classId,
    grade,
    topic: topic.trim(),
    type,
    difficulty,
    count,
  });

  if (result.error) {
    return res.status(422).json({ status: "error", message: result.error });
  }

  res.json({ status: "ok", data: result });
});

/**
 * POST /api/arena/results — Lưu kết quả trận đấu
 */
export const submitResult = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ValidationError("Không xác định được người dùng.");

  const { score, mode, winner, opponent, topic } = req.body;

  if (score === undefined || !mode || winner === undefined || !opponent) {
    throw new ValidationError("Thiếu dữ liệu: score, mode, winner, opponent là bắt buộc.");
  }

  if (!["PVP", "AI"].includes(mode)) {
    throw new ValidationError("mode phải là 'PVP' hoặc 'AI'.");
  }

  const result = await saveArenaResult({
    userId,
    score: Number(score),
    mode,
    winner: Boolean(winner),
    opponent,
    topic,
  });

  res.status(201).json({ status: "ok", data: { result } });
});

/**
 * GET /api/arena/leaderboard — Bảng xếp hạng top 10
 */
export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const data = await getLeaderboard(limit);
  res.json({ status: "ok", data: { leaderboard: data } });
});

/**
 * GET /api/arena/my-stats — Thống kê cá nhân
 */
export const myStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ValidationError("Không xác định được người dùng.");

  const stats = await getUserArenaStats(userId);
  res.json({ status: "ok", data: { stats } });
});

/**
 * POST /api/arena/analyze — Phân tích hiệu suất trận đấu
 */
export const analyzePerformance = asyncHandler(async (req: Request, res: Response) => {
  const { topic, results } = req.body;

  if (!topic || !results || !Array.isArray(results)) {
    throw new ValidationError("Thiếu dữ liệu: topic và results là bắt buộc.");
  }

  const analysis = await analyzeArenaPerformance({ topic, results });
  res.json({ status: "ok", data: analysis });
});
