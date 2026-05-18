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

export const getQuizLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const keyword = req.query.keyword as string | undefined;

  const result = await reportService.getQuizLogs(page, limit, keyword);
  res.json({ status: "ok", data: result });
});

export const getStudentActivityStats = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string | undefined;

  const result = await reportService.getStudentActivityStats(page, limit, search);
  res.json({ status: "ok", data: result });
});

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 50,
    source: req.query.source as string,
    userId: req.query.userId as string,
    username: req.query.username as string,
    module: req.query.module as string,
    method: req.query.method as string,
    statusGroup: req.query.statusGroup as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    search: req.query.search as string,
    minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
  };

  const result = await reportService.getActivityLogs(filters);
  res.json({ status: "ok", data: result });
});

export const getActivityLogDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reportService.getActivityLogById(id);
  
  if (!result) {
    res.status(404).json({ status: "error", message: "Không tìm thấy nhật ký hoạt động này." });
    return;
  }

  res.json({ status: "ok", data: result });
});

export const getActivityLogSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.getActivityLogSummary();
  res.json({ status: "ok", data: result });
});

export const clearActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  await reportService.clearActivityLogs();
  res.json({ status: "ok", message: "Đã xóa sạch toàn bộ nhật ký hoạt động." });
});

export const exportActivityLogsExcel = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    source: req.query.source as string,
    userId: req.query.userId as string,
    module: req.query.module as string,
    statusGroup: req.query.statusGroup as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    search: req.query.search as string,
    limit: 10000, // Lấy tối đa 10k dòng cho báo cáo
  };

  const result = await reportService.getActivityLogs(filters);
  const logs = result.data;

  const excelData = logs.map(log => ({
    "Thời gian": new Date(log.createdAt).toLocaleString("vi-VN"),
    "Người dùng": log.username || "Khách",
    "Vai trò": log.userRole || "N/A",
    "Nguồn": log.source === "student" ? "Học sinh" : (log.source === "admin" ? "Admin" : "Khách"),
    "Phương thức": log.method,
    "Module": log.module,
    "Mô tả hành động": log.action,
    "Đường dẫn": log.path,
    "Mã trạng thái": log.statusCode,
    "Thời gian xử lý (ms)": log.durationMs,
    "Địa chỉ IP": log.ipAddress,
    "Thiết bị (User Agent)": log.userAgent,
    "Lỗi": log.errorMessage || "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Điều chỉnh độ rộng cột sơ bộ
  const wscols = [
    { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
    { wch: 15 }, { wch: 35 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
    { wch: 15 }, { wch: 40 }, { wch: 30 }
  ];
  ws["!cols"] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename=bao_cao_hoat_dong_${new Date().toISOString().slice(0, 10)}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
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
