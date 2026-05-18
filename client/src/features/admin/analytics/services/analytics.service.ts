import { apiClient } from "@/lib/apiClient";
import { 
  ActivityTimeStat, 
  TopStudent, 
  ChatLog,
  ArenaLog,
  ArenaLogDetail,
  UserEngagement,
  ActivityLog,
  ActivityLogSummary
} from "../types";

export const adminAnalyticsService = {
  // Lấy nhật ký hội thoại (Chat Logs)
  getChatLogs: async (params?: { page?: number; limit?: number; keyword?: string; userId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<{ status: string; data: { data: ChatLog[]; pagination: any } }>(`/api/reports/chat-logs?${query}`);
  },

  // Thống kê thời gian học tập (Heatmap/Bar)
  getStudyTimeAnalytics: async () => {
    return apiClient<{ status: string; data: ActivityTimeStat[] }>("/api/reports/study-time");
  },

  // Bảng xếp hạng theo tháng
  getMonthlyLeaderboard: async (params?: { month?: number; year?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<{ status: string; data: TopStudent[] }>(`/api/reports/leaderboard/monthly?${query}`);
  },

  // Lịch sử đấu Arena (PvP + AI) - Sử dụng endpoint arena-logs mới
  getArenaLogs: async (params?: { page?: number; limit?: number; userId?: string; mode?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<{ status: string; data: { data: ArenaLog[]; pagination: any } }>(`/api/reports/arena-logs?${query}`);
  },

  // Chi tiết một trận đấu Arena
  getArenaLogDetail: async (id: string) => {
    return apiClient<{ status: string; data: ArenaLogDetail }>(`/api/reports/arena-logs/${id}`);
  },

  // Nhật ký Ôn tập (Quiz History)
  getQuizLogs: async (params?: { page?: number; limit?: number; keyword?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<any>(`/api/reports/quiz-logs?${query}`);
  },

  // Thống kê học sinh (Student Activity Stats)
  getStudentStats: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<any>(`/api/reports/student-stats?${query}`);
  },

  // Chuyên cần & Phân bổ hạng
  getUserEngagement: async () => {
    return apiClient<{ status: string; data: UserEngagement }>("/api/reports/user-engagement");
  },

  // Nhật ký hành động (Activity Logs)
  getActivityLogs: async (params?: any) => {
    // Loại bỏ các params undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return apiClient<{ status: string; data: { data: ActivityLog[]; pagination: any } }>(`/api/reports/activity-logs?${query}`);
  },

  // Thống kê tổng hợp Activity Logs
  getActivityLogSummary: async () => {
    return apiClient<{ status: string; data: ActivityLogSummary }>("/api/reports/activity-logs/summary");
  },

  // Chi tiết một Activity Log
  getActivityLogDetail: async (id: string) => {
    return apiClient<{ status: string; data: ActivityLog }>(`/api/reports/activity-logs/${id}`);
  },

  // Lấy chi tiết thông tin học sinh (Profile + Stats cơ bản)
  getStudentDetail: async (id: string) => {
    return apiClient<any>(`/api/users/${id}`);
  },
};
