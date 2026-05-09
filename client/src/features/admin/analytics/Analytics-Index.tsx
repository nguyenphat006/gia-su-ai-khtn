import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Swords, 
  Users, 
  Clock, 
  Trophy, 
  TrendingUp, 
  BarChart3,
  Calendar,
  Zap,
  Search,
  Filter,
  ArrowRight,
  User as UserIcon,
  Flame,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCcw,
  Download,
  Share2,
  FileSpreadsheet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminAnalyticsService } from "./services/analytics.service"
import { ResponsiveModal } from "@/components/ui/ResponsiveModal"
import FormattedContent from "@/components/ui/FormattedContent"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { 
  ActivityTimeStat, 
  TopStudent, 
  ChatLog,
  UserEngagement
} from "./types"

// Simple Stats Card
function StatsCard({ label, value, icon: Icon, color, trend }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden"
    >
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-[0.03]", color)}></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-900 leading-tight">{value}</h4>
            {trend && <span className="text-[10px] font-bold text-emerald-500">+{trend}%</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const DAYS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export default function AnalyticsIndex() {
  const [activeTab, setActiveTab] = React.useState<"general" | "chat" | "ranking">("general");
  const [loading, setLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Data States
  const [engagement, setEngagement] = React.useState<UserEngagement | null>(null);
  const [topStudents, setTopStudents] = React.useState<TopStudent[]>([]);
  const [chatLogs, setChatLogs] = React.useState<ChatLog[]>([]);
  const [activityTime, setActivityTime] = React.useState<ActivityTimeStat[]>([]);

  // Pagination State for Chat Logs
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  // Selected Log & Session State
  const [selectedLog, setSelectedLog] = React.useState<ChatLog | null>(null);
  const [sessionMessages, setSessionMessages] = React.useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = React.useState(false);

  // Hover state for Heatmap Tooltip
  const [hoveredCell, setHoveredCell] = React.useState<{ day: number, hour: number } | null>(null);

  const fetchGeneralData = React.useCallback(async () => {
    try {
      const [engRes, timeRes, rankingRes] = await Promise.all([
        adminAnalyticsService.getUserEngagement(),
        adminAnalyticsService.getStudyTimeAnalytics(),
        adminAnalyticsService.getMonthlyLeaderboard()
      ]);
      
      setEngagement(engRes.data);
      setActivityTime(timeRes.data);
      
      const students: TopStudent[] = (rankingRes.data as any[] || []).map(item => ({
        userId: item.userId,
        displayName: item.user?.displayName || "Học sinh",
        username: item.user?.username || "",
        xp: item.totalXp || 0,
        rank: "Học viên",
        streak: 0
      }));
      setTopStudents(students);
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

  const fetchAllData = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    await Promise.all([fetchGeneralData(), fetchChatLogs()]);
    if (showLoading) setLoading(false);
  }, [fetchGeneralData, fetchChatLogs]);

  // Initial Fetch on mount
  React.useEffect(() => {
    fetchAllData();
  }, []);

  // Refetch chat logs when pagination changes
  React.useEffect(() => {
    fetchChatLogs();
  }, [pagination.pageIndex, pagination.pageSize]);

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
    if (selectedLog?.sessionId) {
      fetchSessionMessages(selectedLog.sessionId);
    } else {
      setSessionMessages([]);
    }
  }, [selectedLog]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Đang tạo file Excel...");

    try {
      // Dynamic import XLSX for performance
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // 1. Sheet Tổng quan
      const summaryData = [
        ["CHỈ SỐ", "GIÁ TRỊ"],
        ["Học sinh tích cực", topStudents.length],
        ["Tổng lượt Chat", totalLogs],
        ["Chuỗi chuyên cần cao nhất", engagement?.topStreaks?.[0]?.longestStreak || 0],
        ["Tổng tương tác hệ thống", activityTime?.reduce((acc, curr) => acc + (curr.count || (curr as any).actionCount || 0), 0)]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tong quan");

      // 2. Sheet Xếp hạng
      const rankingData = topStudents.map((s, i) => ({
        "Hạng": i + 1,
        "Họ và tên": s.displayName,
        "Username": s.username,
        "EXP Tháng": s.xp
      }));
      const wsRanking = XLSX.utils.json_to_sheet(rankingData);
      XLSX.utils.book_append_sheet(wb, wsRanking, "Xep hang");

      // 3. Sheet Nhật ký Chat
      const chatData = chatLogs.map(log => ({
        "Thời gian": new Date(log.createdAt).toLocaleString(),
        "Học sinh": log.session?.user?.displayName || "Ẩn danh",
        "Câu hỏi": log.question,
        "AI trả lời": log.answer
      }));
      const wsChat = XLSX.utils.json_to_sheet(chatData);
      XLSX.utils.book_append_sheet(wb, wsChat, "Nhat ky Chat");

      // 4. Sheet Phân bổ hạng
      const rankData = engagement?.rankDistribution?.map(r => ({
        "Danh hiệu": r.rank,
        "Số học sinh": r.count
      })) || [];
      const wsRanks = XLSX.utils.json_to_sheet(rankData);
      XLSX.utils.book_append_sheet(wb, wsRanks, "Phan bo Danh hieu");

      // Save file
      XLSX.writeFile(wb, `bao_cao_giasu_ai_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Đã xuất file Excel thành công!", { id: toastId });
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
  ];

  // Helper for Heatmap Color
  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-slate-50";
    if (count < 5) return "bg-sky-100";
    if (count < 10) return "bg-sky-200";
    if (count < 20) return "bg-sky-300";
    if (count < 50) return "bg-sky-400";
    return "bg-sky-600";
  };

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
          <Button 
            variant="outline" 
            onClick={() => fetchAllData(true)}
            disabled={loading}
            className="rounded-xl border-slate-200 h-10 w-10 p-0 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
          >
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
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard label="Học sinh tích cực" value={topStudents?.length || 0} icon={Users} color="bg-emerald-500" />
              <StatsCard label="Câu hỏi đã hỏi" value={totalLogs || 0} icon={MessageSquare} color="bg-sky-500" />
              <StatsCard label="Chuỗi đăng nhập Max" value={engagement?.topStreaks?.[0]?.longestStreak || 0} icon={Flame} color="bg-orange-500" />
              <StatsCard label="Tổng tương tác" value={activityTime?.reduce((acc, curr) => acc + (curr.count || (curr as any).actionCount || 0), 0).toLocaleString() || 0} icon={Zap} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Professional Heatmap Analysis */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 border border-sky-100 shadow-sm">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Ma trận thời điểm học tập</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phân tích hoạt động theo Thứ và Giờ</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Ít</span>
                        <div className="flex gap-1">
                           <div className="w-3 h-3 rounded-sm bg-slate-50 border border-slate-100"></div>
                           <div className="w-3 h-3 rounded-sm bg-sky-100"></div>
                           <div className="w-3 h-3 rounded-sm bg-sky-300"></div>
                           <div className="w-3 h-3 rounded-sm bg-sky-600"></div>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Nhiều</span>
                     </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                  <div className="min-w-[800px] space-y-1">
                    {/* Hour Labels */}
                    <div className="flex ml-16 mb-2">
                       {Array.from({ length: 24 }).map((_, h) => (
                         <div key={h} className="flex-1 text-center text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                           {h}h
                         </div>
                       ))}
                    </div>

                    {/* Day Rows */}
                    {Array.from({ length: 7 }).map((_, day) => (
                      <div key={day} className="flex items-center gap-2">
                         <div className="w-14 text-right pr-2">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{DAYS[day]}</span>
                         </div>
                         <div className="flex-1 flex gap-1 h-8 sm:h-10">
                            {Array.from({ length: 24 }).map((_, hour) => {
                              const cellData = activityTime?.find(s => 
                                (s.hour === hour || (s as any).hourOfDay === hour) && 
                                (s.dayOfWeek === day)
                              );
                              const count = cellData ? (cellData.count || (cellData as any).actionCount || 0) : 0;
                              const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour;

                              return (
                                <div 
                                  key={hour}
                                  className="flex-1 relative group"
                                  onMouseEnter={() => setHoveredCell({ day, hour })}
                                  onMouseLeave={() => setHoveredCell(null)}
                                >
                                   <motion.div 
                                     initial={false}
                                     animate={{ scale: isHovered ? 1.1 : 1 }}
                                     className={cn(
                                       "w-full h-full rounded-md border border-white/20 transition-colors duration-300 cursor-pointer",
                                       getHeatmapColor(count),
                                       isHovered && "ring-2 ring-sky-500 ring-offset-1 z-10 shadow-lg"
                                     )}
                                   />
                                   
                                   {/* Tooltip */}
                                   <AnimatePresence>
                                     {isHovered && (
                                       <motion.div 
                                         initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                         animate={{ opacity: 1, y: 0, scale: 1 }}
                                         exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                         className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white p-2 rounded-lg z-50 shadow-2xl min-w-[120px] pointer-events-none text-center"
                                       >
                                         <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{DAYS[day]}, {hour}:00</p>
                                         <div className="flex items-center justify-center gap-2">
                                            <span className="text-xs font-bold">{count}</span>
                                            <span className="text-[7px] font-bold text-sky-400 uppercase tracking-widest">Tương tác</span>
                                         </div>
                                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                                       </motion.div>
                                     )}
                                   </AnimatePresence>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lower Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Rank Distribution */}
                 <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Phân phối danh hiệu</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tỉ lệ trình độ học sinh</p>
                      </div>
                    </div>
                    <div className="space-y-5 flex-1">
                       {engagement?.rankDistribution?.map((rank, idx) => (
                         <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{rank.rank}</p>
                              <p className="text-[10px] font-bold text-slate-400"><b>{rank.count}</b> học sinh</p>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (rank.count / 50) * 100)}%` }}
                                className={cn(
                                  "h-full rounded-full shadow-sm",
                                  idx === 0 ? "bg-amber-500" : (idx === 1 ? "bg-sky-500" : "bg-indigo-500")
                                )}
                              />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Streak Summary */}
                 <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm">
                        <Flame size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Thống kê Chuyên cần</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hiệu suất rèn luyện trung bình</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                       <div className="relative">
                          <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center relative z-10">
                             <div className="text-center">
                                <span className="text-3xl font-bold text-slate-900">84%</span>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Rate</p>
                             </div>
                          </div>
                          <svg className="absolute inset-0 w-32 h-32 -rotate-90 z-20 pointer-events-none">
                             <circle cx="64" cy="64" r="56" fill="transparent" stroke="url(#active-gradient)" strokeWidth="8" strokeDasharray={`${0.84 * 351} 351`} strokeLinecap="round" />
                             <defs>
                                <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                   <stop offset="0%" stopColor="#10b981" />
                                   <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                             </defs>
                          </svg>
                       </div>
                       <p className="text-[10px] text-slate-500 font-medium max-w-[200px] leading-relaxed italic">
                         Dựa trên chuỗi ngày học tập và tần suất tương tác của toàn bộ học sinh trong tháng này.
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Tìm kiếm nội dung hội thoại..." className="pl-10 h-10 rounded-xl font-bold" />
              </div>
              <Button variant="outline" onClick={() => fetchChatLogs()} className="h-10 rounded-xl gap-2 border-slate-200">
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
              </Button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học sinh</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</th>
                      <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {chatLogs?.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                        <td className="p-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "---"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-[10px] font-bold uppercase border border-white shadow-sm">
                               {log.session?.user?.displayName?.[0] || "?"}
                             </div>
                             <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                               {log.session?.user?.displayName || "Ẩn danh"}
                             </span>
                          </div>
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="text-xs font-medium text-slate-600 line-clamp-1 italic">"{log.question}"</p>
                        </td>
                        <td className="p-4 text-right">
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50">
                             <ArrowRight size={14} />
                           </Button>
                        </td>
                      </tr>
                    ))}
                    {chatLogs.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic text-xs">Chưa có nhật ký hội thoại nào.</td>
                      </tr>
                    )}
                 </tbody>
               </table>
            </div>

            {/* Pagination Controls */}
            {chatLogs.length > 0 && (
              <div className="mt-4">
                <DataTablePagination 
                  table={{
                    getState: () => ({ pagination }),
                    setPageIndex: (index: number) => setPagination(prev => ({ ...prev, pageIndex: index })),
                    setPageSize: (size: number) => setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 })),
                    getPageCount: () => totalPages,
                    getCanPreviousPage: () => pagination.pageIndex > 0,
                    getCanNextPage: () => pagination.pageIndex < totalPages - 1,
                    previousPage: () => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
                    nextPage: () => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
                    getFilteredSelectedRowModel: () => ({ rows: [] })
                  } as any}
                  totalCount={totalLogs}
                />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "ranking" && (
          <motion.div
            key="ranking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                    <Trophy size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Vinh danh Tháng {new Date().getMonth() + 1}</h3>
                </div>
                <Calendar size={18} className="text-slate-300" />
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {topStudents?.map((s, idx) => (
                  <div key={idx} className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                    idx === 0 ? "bg-amber-50 border-amber-200 shadow-md shadow-amber-100" : "bg-white border-slate-100 hover:bg-slate-50"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                      idx === 0 ? "bg-amber-400 text-white" : (idx === 1 ? "bg-slate-300 text-white" : (idx === 2 ? "bg-orange-300 text-white" : "bg-slate-50 text-slate-400"))
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight">{s.displayName}</p>
                      <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5 uppercase">{s.rank}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-sky-600 leading-tight">{(s.xp || 0).toLocaleString()}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">EXP Tháng</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Kỷ luật & Chuyên cần</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Những học sinh chăm chỉ nhất</p>
                  </div>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                   {engagement?.topStreaks?.slice(0, 20).map((streak, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">
                              {idx + 1}
                           </div>
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight leading-tight mb-1">{streak.user?.displayName || "Học sinh"}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">@{streak.user?.username}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                           <Flame size={12} className="text-orange-500 fill-orange-500" />
                           <span className="text-xs font-bold text-orange-700">{streak.longestStreak} ngày</span>
                        </div>
                     </div>
                   ))}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Detail Modal */}
      <ResponsiveModal
        isOpen={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        title="Chi tiết hội thoại"
        maxWidth="3xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-sky-600 font-bold uppercase">
                   {selectedLog.session?.user?.displayName?.[0] || "?"}
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-900">{selectedLog.session?.user?.displayName || "Ẩn danh"}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     @{selectedLog.session?.user?.username || "unknown"}
                   </p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</p>
                 <p className="text-xs font-bold text-slate-600">
                   {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "---"}
                 </p>
               </div>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar px-1">
               {isLoadingSession ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang trích xuất toàn bộ hội thoại...</p>
                 </div>
               ) : sessionMessages.length > 0 ? (
                 <div className="space-y-4">
                   {sessionMessages.map((msg, idx) => (
                     <div key={idx} className={cn(
                       "flex flex-col gap-2 max-w-[90%]",
                       msg.role === "USER" ? "ml-auto items-end" : "mr-auto items-start"
                     )}>
                        <div className={cn(
                          "flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest px-1",
                          msg.role === "USER" ? "text-slate-400" : "text-sky-500"
                        )}>
                          {msg.role === "USER" ? <UserIcon size={10} /> : <Zap size={10} className="text-orange-400" />}
                          {msg.role === "USER" ? "Học sinh" : "Trợ lý AI"}
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl text-sm leading-relaxed",
                          msg.role === "USER" 
                            ? "bg-sky-50 text-sky-900 rounded-tr-none border border-sky-100 font-bold italic shadow-sm" 
                            : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-md"
                        )}>
                          <FormattedContent content={msg.content} />
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        <UserIcon size={12} /> Học sinh hỏi
                      </div>
                      <div className="bg-sky-50 p-5 rounded-2xl rounded-tl-none border border-sky-100 text-sky-900 text-sm font-bold italic leading-relaxed shadow-sm">
                        "{selectedLog.question}"
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        <Zap size={12} className="text-orange-400" /> Trợ lý AI trả lời
                      </div>
                      <div className="bg-white p-6 rounded-2xl rounded-tr-none border border-slate-100 shadow-sm text-slate-700 text-sm leading-relaxed prose prose-slate max-w-none">
                        <FormattedContent content={selectedLog.answer || "AI chưa có phản hồi cho câu hỏi này."} />
                      </div>
                   </div>
                 </div>
               )}
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
               <Button onClick={() => setSelectedLog(null)} className="rounded-xl px-10 h-11 font-bold uppercase tracking-[0.2em] text-[10px] bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95">Đóng cửa sổ</Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </div>
  )
}
