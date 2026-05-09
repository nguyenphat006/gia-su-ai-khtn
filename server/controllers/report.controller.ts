import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import * as reportService from "../services/report.service.js";
import * as XLSX from "xlsx";

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

export const exportArenaLogsExcel = asyncHandler(async (req: Request, res: Response) => {
  // Lấy toàn bộ dữ liệu arena (không phân trang) để xuất excel
  const result = await reportService.getArenaLogs(1, 10000); 
  const logs = result.data;

  // Flatten dữ liệu để đưa vào Excel
  const excelData = logs.map(log => ({
    "Mã trận": log.id,
    "Ngày đấu": new Date(log.createdAt).toLocaleString(),
    "Chế độ": log.mode === "PVP" ? "Đối kháng" : "Đấu với AI",
    "Chủ đề": log.topic,
    "Học sinh 1": log.player1.displayName,
    "Username HS1": log.player1.username,
    "Mã HS1": log.player1.studentCode,
    "Điểm HS1": log.player1.score,
    "Kết quả HS1": log.player1.winner ? "Thắng" : "Thua",
    "XP nhận HS1": log.player1.xpEarned,
    "Học sinh 2/AI": log.player2.displayName,
    "Username HS2": log.player2.username || "N/A",
    "Mã HS2": log.player2.studentCode || "N/A",
    "Điểm HS2": log.player2.score || 0,
    "Kết quả HS2": log.player2.winner ? "Thắng" : "Thua",
    "XP nhận HS2": log.player2.xpEarned || 0,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb, ws, "Arena Logs");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename=bao_cao_arena_${new Date().toISOString().slice(0, 10)}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});
