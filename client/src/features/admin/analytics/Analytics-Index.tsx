import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Trophy, 
  Zap,
  RefreshCcw,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { adminAnalyticsService } from "./services/analytics.service"
import { toast } from "sonner"
import { 
  ActivityTimeStat, 
  TopStudent, 
  ChatLog,
  UserEngagement
} from "./types"

// Sub-components
import { ChatLogDetailModal } from "./components/ChatLogDetailModal"
import { RankStudentListModal } from "./components/RankStudentListModal"
import { GeneralAnalyticsTab } from "./components/GeneralAnalyticsTab"
import { ChatLogsTab } from "./components/ChatLogsTab"
import { RankingTab } from "./components/RankingTab"
import { QuizLogsTab } from "./components/QuizLogsTab"

export default function AnalyticsIndex() {
  const [activeTab, setActiveTab] = React.useState<"general" | "chat" | "ranking" | "quiz">("general");
  const [loading, setLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Data States
  const [engagement, setEngagement] = React.useState<UserEngagement | null>(null);
  const [topStudents, setTopStudents] = React.useState<TopStudent[]>([]);
  const [chatLogs, setChatLogs] = React.useState<ChatLog[]>([]);
  const [studentStats, setStudentStats] = React.useState<any[]>([]);
  const [activityTime, setActivityTime] = React.useState<ActivityTimeStat[]>([]);

  // Ranking Filter State
  const currentNow = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(currentNow.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(2026);

  // Pagination State for Chat Logs
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  // Pagination State for Student Stats
  const [studentPagination, setStudentPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [studentTotalPages, setStudentTotalPages] = React.useState(1);
  const [studentTotalLogs, setStudentTotalLogs] = React.useState(0);
  const [studentSearch, setStudentSearch] = React.useState("");

  // Selected Log & Session State
  const [selectedLog, setSelectedLog] = React.useState<ChatLog | null>(null);
  const [sessionMessages, setSessionMessages] = React.useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = React.useState(false);

  // Selected Rank State for student list
  const [selectedRank, setSelectedRank] = React.useState<{ rank: string, count: number, students: any[] } | null>(null);

  const fetchLeaderboard = React.useCallback(async (m: number, y: number) => {
    try {
      const res = await adminAnalyticsService.getMonthlyLeaderboard({ month: m, year: y });
      const students: TopStudent[] = (res.data as any[] || []).map(item => ({
        userId: item.userId,
        displayName: item.user?.displayName || "Học sinh",
        username: item.user?.username || "",
        xp: item.totalXp || 0,
        rank: "Học viên",
        streak: 0
      }));
      setTopStudents(students);
    } catch (error) {
      console.error("Lỗi khi tải bảng xếp hạng:", error);
    }
  }, []);

  const fetchGeneralData = React.useCallback(async () => {
    try {
      const [engRes, timeRes] = await Promise.all([
        adminAnalyticsService.getUserEngagement(),
        adminAnalyticsService.getStudyTimeAnalytics(),
      ]);
      setEngagement(engRes.data);
      setActivityTime(timeRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu chung:", error);
    }
  }, []);

  const fetchChatLogs = React.useCallback(async () => {
    try {
      const res = await adminAnalyticsService.getChatLogs({ 
        page: pagination.pageIndex + 1, 
        limit: pagination.pageSize 
      });
      const payload = res.data as any;
      setChatLogs(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalLogs(payload.pagination?.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải nhật ký chat:", error);
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  const fetchStudentStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAnalyticsService.getStudentStats({ 
        page: studentPagination.pageIndex + 1, 
        limit: studentPagination.pageSize,
        search: studentSearch
      });
      const payload = res.data as any;
      setStudentStats(payload.data || []);
      setStudentTotalPages(payload.pagination?.totalPages || 1);
      setStudentTotalLogs(payload.pagination?.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải thống kê học sinh:", error);
    } finally {
      setLoading(false);
    }
  }, [studentPagination.pageIndex, studentPagination.pageSize, studentSearch]);

  const fetchAllData = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    await Promise.all([
      fetchGeneralData(), 
      fetchChatLogs(),
      fetchStudentStats(),
      fetchLeaderboard(selectedMonth, selectedYear)
    ]);
    if (showLoading) setLoading(false);
  }, [fetchGeneralData, fetchChatLogs, fetchStudentStats, fetchLeaderboard, selectedMonth, selectedYear]);

  React.useEffect(() => { fetchData(); }, []); // eslint-disable-line

  const fetchData = () => fetchAllData(true);

  React.useEffect(() => {
    fetchLeaderboard(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchLeaderboard]);

  React.useEffect(() => {
    fetchChatLogs();
  }, [pagination.pageIndex, pagination.pageSize, fetchChatLogs]);

  React.useEffect(() => {
    fetchStudentStats();
  }, [studentPagination.pageIndex, studentPagination.pageSize, fetchStudentStats]);

  const fetchSessionMessages = async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const { chatService } = await import("@/features/chat/service");
      const messages = await chatService.getMessages(sessionId);
      setSessionMessages(messages);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử phiên:", error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  React.useEffect(() => {
    if (selectedLog?.sessionId) fetchSessionMessages(selectedLog.sessionId);
    else setSessionMessages([]);
  }, [selectedLog]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Đang tạo file Excel chuyên nghiệp...");

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ["BÁO CÁO TỔNG QUAN HỆ THỐNG GIA SƯ AI KHTN"],
        ["Ngày xuất báo cáo:", new Date().toLocaleString()],
        [],
        ["CHỈ SỐ", "GIÁ TRỊ", "GHI CHÚ"],
        ["Học sinh tích cực", (engagement?.rankDistribution?.reduce((acc, curr) => acc + curr.count, 0) || 0), "Số lượng học sinh có phát sinh điểm EXP"],
        ["Tổng lượt thảo luận AI", totalLogs, "Tổng số câu hỏi học sinh đã gửi cho chatbot"],
        ["Chuỗi chuyên cần cao nhất", engagement?.topStreaks?.[0]?.longestStreak || 0, "Số ngày học liên tiếp dài nhất"],
        ["Tổng tương tác hệ thống", activityTime?.reduce((acc, curr) => acc + (curr.count || (curr as any).actionCount || 0), 0), "Tổng hành động trên toàn hệ thống"]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tong quan");

      const rankingData = topStudents.map((s, i) => ({
        "HẠNG": i + 1,
        "HỌ VÀ TÊN": s.displayName,
        "TÊN ĐĂNG NHẬP": s.username,
        [`EXP THÁNG ${selectedMonth}/${selectedYear}`]: s.xp,
      }));
      const wsRanking = XLSX.utils.json_to_sheet(rankingData);
      wsRanking["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsRanking, `Xep hang T${selectedMonth}`);

      const chatData = chatLogs.map(log => ({
        "THỜI GIAN": new Date(log.createdAt).toLocaleString(),
        "HỌC SINH": log.session?.user?.displayName || "Ẩn danh",
        "NỘI DUNG CÂU HỎI": log.question,
        "PHẢN HỒI TỪ AI": log.answer
      }));
      const wsChat = XLSX.utils.json_to_sheet(chatData);
      wsChat["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 50 }, { wch: 60 }];
      // 4. Sheet Phân bổ Danh hiệu (Kèm danh sách học sinh)
      const rankRows: any[] = [["DANH HIỆU", "SỐ LƯỢNG", "DANH SÁCH HỌC SINH"]];
      engagement?.rankDistribution?.forEach(r => {
        const studentNames = r.students?.map((s: any) => s.displayName).join(", ") || "";
        rankRows.push([r.rank, r.count, studentNames]);
      });
      const wsRanks = XLSX.utils.aoa_to_sheet(rankRows);
      wsRanks["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 100 }];
      XLSX.utils.book_append_sheet(wb, wsRanks, "Phan bo Danh hieu");

      // 5. Sheet Thống kê Học sinh (Student Stats)
      const exportStudentStats = studentStats.map(s => ({
        "HỌ VÀ TÊN": s.displayName,
        "MÃ HS": s.studentCode,
        "LỚP": s.className,
        "CHAT AI": s.stats.aiChatCount,
        "MINDMAP": s.stats.mindmapCount,
        "FLASHCARD": s.stats.flashcardCount,
        "ĐẤU TRƯỜNG": s.stats.arenaCount,
        "TỔNG EXP": s.stats.totalXp,
        "CHUỖI": s.stats.currentStreak
      }));
      const wsStudent = XLSX.utils.json_to_sheet(exportStudentStats);
      wsStudent["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, wsStudent, "Thong ke Hoc sinh");

      // Save file
      XLSX.writeFile(wb, `bao_cao_tong_hop_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Đã xuất báo cáo thành công!", { id: toastId });
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Lỗi khi tạo file Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: "general", label: "Tổng quan", icon: LayoutDashboard },
    { id: "chat", label: "Nhật ký Chat", icon: MessageSquare },
    { id: "ranking", label: "Xếp hạng", icon: Trophy },
    { id: "quiz", label: "Ôn tập", icon: CheckCircle2 },
  ];

  const months = [
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1.5">Báo cáo & Phân tích</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giám sát hoạt động và sự tiến bộ của học sinh</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" onClick={() => fetchAllData(true)} disabled={loading} className="rounded-xl border-slate-200 h-10 w-10 p-0 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </Button>

          <Button variant="outline" onClick={handleExportExcel} disabled={isExporting} className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
            {isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span>Xuất Excel</span>
          </Button>

          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-fit ml-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative",
                  activeTab === tab.id ? "text-sky-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="active-tab-report" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-100" />
                )}
                <tab.icon size={14} className="relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "general" && (
          <GeneralAnalyticsTab 
            engagement={engagement}
            totalLogs={totalLogs}
            activityTime={activityTime}
            topStudentsCount={topStudents.length}
            onRankClick={setSelectedRank}
          />
        )}

        {activeTab === "chat" && (
          <ChatLogsTab 
            chatLogs={chatLogs}
            loading={loading}
            pagination={pagination}
            setPagination={setPagination}
            totalPages={totalPages}
            totalLogs={totalLogs}
            fetchChatLogs={fetchChatLogs}
            onViewDetail={setSelectedLog}
          />
        )}

        {activeTab === "ranking" && (
          <RankingTab 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            topStudents={topStudents}
            engagement={engagement}
            months={months}
          />
        )}

        {activeTab === "quiz" && (
          <QuizLogsTab 
            studentStats={studentStats}
            loading={loading}
            studentPagination={studentPagination}
            setStudentPagination={setStudentPagination}
            studentTotalPages={studentTotalPages}
            studentTotalLogs={studentTotalLogs}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            fetchStudentStats={fetchStudentStats}
          />
        )}
      </AnimatePresence>

      <ChatLogDetailModal selectedLog={selectedLog} onClose={() => setSelectedLog(null)} isLoadingSession={isLoadingSession} sessionMessages={sessionMessages} />
      <RankStudentListModal selectedRank={selectedRank} onClose={() => setSelectedRank(null)} />
    </div>
  )
}
