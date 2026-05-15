import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import { Role } from "@prisma/client";

/**
 * Middleware ghi nhật ký hoạt động hệ thống
 */
export const activityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Bắt sự kiện khi response kết thúc
  res.on("finish", async () => {
    try {
      const path = req.path;

      // Bỏ qua các path không cần log
      if (shouldSkipLog(path)) return;

      const duration = Date.now() - startTime;
      const { module, action } = resolveModuleAndAction(req.method, path);
      const source = resolveSource(req.auth?.role);

      // Trích xuất và che giấu thông tin nhạy cảm
      const queryParams = maskSensitiveData(req.query);
      const requestBody = maskSensitiveData(req.body);

      // Lưu log vào Database (không await để không block luồng xử lý)
      prisma.activityLog.create({
        data: {
          userId: req.auth?.userId ?? null,
          username: req.auth?.username ?? null,
          userRole: req.auth?.role ?? null,
          source,
          method: req.method,
          path,
          module,
          action,
          statusCode: res.statusCode,
          durationMs: duration,
          ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || null,
          userAgent: req.headers["user-agent"] ?? null,
          errorMessage: res.statusCode >= 400 ? (res.locals.errorMessage ?? null) : null,
          queryParams,
          requestBody,
        },
      }).then(() => {
        // Log ra terminal để dễ theo dõi
        const statusColor = res.statusCode < 300 ? "\x1b[32m" : res.statusCode < 500 ? "\x1b[33m" : "\x1b[31m";
        const reset = "\x1b[0m";
        console.log(`[Activity] ${req.method} ${path} - ${statusColor}${res.statusCode}${reset} (${duration}ms) - ${action}`);
      }).catch((err) => {
        console.error("Lỗi khi ghi ActivityLog:", err);
      });
    } catch (error) {
      console.error("Lỗi trong activityLogger middleware:", error);
    }
  });

  next();
};

/**
 * Danh sách các path bỏ qua không log
 */
const SKIP_PATHS = ["/api/health", "/api-docs", "/favicon.ico"];

function shouldSkipLog(path: string): boolean {
  return SKIP_PATHS.some((p) => path.startsWith(p));
}

/**
 * Phân loại nguồn hành động
 */
function resolveSource(role?: Role): string {
  if (!role) return "guest";
  if (role === Role.STUDENT) return "student";
  return "admin"; // ADMIN hoặc TEACHER
}

/**
 * Xác định Module và Action dựa trên Method và Path
 */
function resolveModuleAndAction(method: string, path: string): { module: string; action: string } {
  // Mapping patterns
  const patterns: { method: string; pattern: RegExp; module: string; action: string }[] = [
    { method: "POST", pattern: /^\/api\/auth\/login$/, module: "auth", action: "Đăng nhập hệ thống" },
    { method: "POST", pattern: /^\/api\/auth\/logout$/, module: "auth", action: "Đăng xuất" },
    { method: "POST", pattern: /^\/api\/auth\/refresh$/, module: "auth", action: "Làm mới phiên đăng nhập" },
    
    // Chat
    { method: "POST", pattern: /^\/api\/chat\/sessions$/, module: "chat", action: "Tạo phiên hội thoại mới" },
    { method: "POST", pattern: /^\/api\/chat\/sessions\/[^/]+\/messages$/, module: "chat", action: "Gửi tin nhắn AI" },
    { method: "GET", pattern: /^\/api\/chat\/sessions$/, module: "chat", action: "Xem danh sách hội thoại" },
    { method: "GET", pattern: /^\/api\/chat\/sessions\/[^/]+$/, module: "chat", action: "Xem chi tiết hội thoại" },
    { method: "DELETE", pattern: /^\/api\/chat\/sessions\/[^/]+$/, module: "chat", action: "Xóa phiên hội thoại" },
    
    // Arena
    { method: "POST", pattern: /^\/api\/arena\/submit$/, module: "arena", action: "Nộp kết quả trận đấu" },
    { method: "GET", pattern: /^\/api\/arena\/leaderboard$/, module: "arena", action: "Xem bảng xếp hạng Arena" },
    { method: "GET", pattern: /^\/api\/arena\/my-stats$/, module: "arena", action: "Xem thống kê cá nhân Arena" },
    { method: "GET", pattern: /^\/api\/arena\/logs$/, module: "arena", action: "Xem lịch sử đấu Arena" },
    
    // Revision
    { method: "POST", pattern: /^\/api\/revision\/quiz\/submit$/, module: "revision", action: "Nộp bài Quiz" },
    { method: "GET", pattern: /^\/api\/revision\/flashcard-decks$/, module: "revision", action: "Xem danh sách bộ Flashcard" },
    { method: "GET", pattern: /^\/api\/revision\/flashcard-decks\/[^/]+$/, module: "revision", action: "Xem chi tiết bộ Flashcard" },
    { method: "GET", pattern: /^\/api\/revision\/mindmaps$/, module: "revision", action: "Xem danh sách sơ đồ tư duy" },
    { method: "GET", pattern: /^\/api\/revision\/mindmaps\/[^/]+$/, module: "revision", action: "Xem chi tiết sơ đồ tư duy" },
    
    // Gamification
    { method: "GET", pattern: /^\/api\/gamification\/daily-reward$/, module: "gamification", action: "Nhận thưởng đăng nhập hàng ngày" },
    { method: "GET", pattern: /^\/api\/gamification\/my-stats$/, module: "gamification", action: "Xem thống kê thành tích" },
    
    // Users
    { method: "GET", pattern: /^\/api\/users$/, module: "users", action: "Xem danh sách người dùng" },
    { method: "POST", pattern: /^\/api\/users$/, module: "users", action: "Tạo tài khoản người dùng" },
    { method: "GET", pattern: /^\/api\/users\/[^/]+$/, module: "users", action: "Xem thông tin chi tiết user" },
    { method: "PUT", pattern: /^\/api\/users\/[^/]+$/, module: "users", action: "Cập nhật thông tin user" },
    { method: "DELETE", pattern: /^\/api\/users\/[^/]+$/, module: "users", action: "Xóa tài khoản user" },
    { method: "POST", pattern: /^\/api\/users\/import-excel$/, module: "users", action: "Import người dùng từ Excel" },
    { method: "GET", pattern: /^\/api\/users\/export-excel$/, module: "users", action: "Xuất danh sách người dùng ra Excel" },
    
    // Classes
    { method: "GET", pattern: /^\/api\/classes$/, module: "classes", action: "Xem danh sách lớp học" },
    { method: "POST", pattern: /^\/api\/classes$/, module: "classes", action: "Tạo lớp học mới" },
    { method: "PUT", pattern: /^\/api\/classes\/[^/]+$/, module: "classes", action: "Cập nhật thông tin lớp" },
    { method: "DELETE", pattern: /^\/api\/classes\/[^/]+$/, module: "classes", action: "Xóa lớp học" },
    
    // System Config
    { method: "GET", pattern: /^\/api\/system\/configs$/, module: "system", action: "Xem cấu hình hệ thống" },
    { method: "POST", pattern: /^\/api\/system\/configs$/, module: "system", action: "Tạo cấu hình hệ thống" },
    { method: "PUT", pattern: /^\/api\/system\/configs\/[^/]+$/, module: "system", action: "Cập nhật cấu hình" },
    
    // Knowledge & Documents
    { method: "GET", pattern: /^\/api\/knowledge$/, module: "knowledge", action: "Xem kho kiến thức" },
    { method: "POST", pattern: /^\/api\/documents\/upload$/, module: "documents", action: "Tải lên tài liệu mới" },
    { method: "GET", pattern: /^\/api\/documents$/, module: "documents", action: "Xem danh sách tài liệu" },
    { method: "DELETE", pattern: /^\/api\/documents\/[^/]+$/, module: "documents", action: "Xóa tài liệu" },
    
    // Reports
    { method: "GET", pattern: /^\/api\/reports\/activity-logs$/, module: "reports", action: "Xem nhật ký hoạt động hệ thống" },
    { method: "GET", pattern: /^\/api\/reports\/activity-logs\/summary$/, module: "reports", action: "Xem thống kê tổng hợp log" },
    { method: "GET", pattern: /^\/api\/reports\/chat-logs$/, module: "reports", action: "Xem nhật ký hội thoại AI" },
    { method: "GET", pattern: /^\/api\/reports\/arena-logs$/, module: "reports", action: "Xem nhật ký Arena" },
    { method: "GET", pattern: /^\/api\/reports\/study-time$/, module: "reports", action: "Xem phân tích thời gian học" },
  ];

  for (const item of patterns) {
    if (item.method === method && item.pattern.test(path)) {
      return { module: item.module, action: item.action };
    }
  }

  // Fallback: lấy segment đầu tiên sau /api/ làm module
  const segments = path.split("/").filter(Boolean);
  const fallbackModule = segments[1] || "system"; // /api/module/...
  const fallbackAction = `${method} ${path}`;

  return { module: fallbackModule, action: fallbackAction };
}

/**
 * Che giấu thông tin nhạy cảm trong dữ liệu (Recursive)
 */
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;

  const SENSITIVE_FIELDS = ["password", "oldPassword", "newPassword", "refreshToken", "token"];
  
  // Clone object để tránh side-effect
  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key in masked) {
    if (SENSITIVE_FIELDS.includes(key)) {
      masked[key] = "********";
    } else if (typeof masked[key] === "object") {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}
