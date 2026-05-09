import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import * as reportService from "../services/report.service.js";

export const getChatLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const keyword = req.query.keyword as string | undefined;
  const userId = req.query.userId as string | undefined;

  const result = await reportService.getChatLogs(page, limit, keyword, userId);
  res.json({ status: "ok", data: result });
});

export const getStudyTimeAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getStudyTimeAnalytics();
  res.json({ status: "ok", data: result });
});

export const getMonthlyLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const year = parseInt(req.query.year as string) || now.getFullYear();
  const month = parseInt(req.query.month as string) || (now.getMonth() + 1);

  const result = await reportService.getMonthlyLeaderboard(year, month);
  res.json({ status: "ok", data: result });
});

export const getArenaLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const userId = req.query.userId as string | undefined;
  const mode = req.query.mode as string | undefined; // 'PVP', 'AI', hoặc undefined (tất cả)

  const result = await reportService.getArenaLogs(page, limit, userId, mode);
  res.json({ status: "ok", data: result });
});

export const getArenaLogDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reportService.getArenaLogDetail(id);
  
  if (!result) {
    res.status(404).json({ status: "error", message: "Không tìm thấy trận đấu này." });
    return;
  }

  res.json({ status: "ok", data: result });
});

export const getUserEngagementStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getUserEngagementStats();
  res.json({ status: "ok", data: result });
});
