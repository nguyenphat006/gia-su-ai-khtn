import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Swords, 
  Search, 
  Trophy, 
  Zap, 
  ChevronRight, 
  Bot, 
  User as UserIcon,
  Calendar,
  Filter,
  RefreshCcw,
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminAnalyticsService } from "@/features/admin/analytics/services/analytics.service"
import { ArenaLog, ArenaLogDetail, ArenaPlayerInfo } from "@/features/admin/analytics/types"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"

// Helper to render player mini-card in list
function PlayerMiniCard({ player, isRight = false }: { player: ArenaPlayerInfo, isRight?: boolean }) {
  const isAI = player.id === null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 sm:gap-3 flex-1 min-w-0",
      isRight ? "flex-row-reverse text-right" : "text-left"
    )}>
       <div className={cn(
         "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-white/50",
         isAI ? "bg-slate-900 text-white" : "bg-sky-50 text-sky-600 border-sky-100"
       )}>
          {isAI ? <Bot size={18} /> : (player.displayName?.[0] || "?")}
       </div>
       <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-700 truncate uppercase leading-tight mb-1">
            {player.displayName}
          </p>
          <div className={cn("flex items-center gap-1.5", isRight ? "justify-end" : "justify-start")}>
             <span className="text-[10px] font-bold text-sky-600 leading-tight">{player.score ?? 0}</span>
             {player.winner ? (
               <CheckCircle2 size={10} className="text-emerald-500" />
             ) : (
               <XCircle size={10} className="text-slate-300" />
             )}
          </div>
       </div>
    </div>
  );
}

export default function ArenaReportsIndex() {
  const [view, setView] = React.useState<"list" | "detail">("list");
  const [selectedMatch, setSelectedMatch] = React.useState<ArenaLogDetail | null>(null);
  const [logs, setLogs] = React.useState<ArenaLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  
  // Pagination State
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 12,
  });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  const [isExporting, setIsExporting] = React.useState(false);
  const searchTimeoutRef = React.useRef<any>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAnalyticsService.getArenaLogs({ 
        page: pagination.pageIndex + 1, 
        limit: pagination.pageSize,
        userId: search.trim()
      });
      const payload = res.data as any;
      setLogs(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalLogs(payload.pagination?.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử đấu trường:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search]);

  React.useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, pagination.pageIndex, pagination.pageSize]);

  const handleViewDetail = async (log: ArenaLog) => {
    setLoading(true);
    try {
      const res = await adminAnalyticsService.getArenaLogDetail(log.id);
      setSelectedMatch(res.data);
      setView("detail");
    } catch (error) {
      console.error("Lỗi khi tải chi tiết trận đấu:", error);
      toast.error("Không thể tải thông tin chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Đang chuẩn bị file Excel...");
    
    try {
      const response = await fetch("/api/reports/arena-export");
      if (!response.ok) throw new Error("Lỗi khi tải file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao_cao_arena_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Đã xuất báo cáo Excel thành công!", { id: toastId });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất báo cáo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-xl shadow-orange-200">
                  <Swords size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Nhật ký Đấu trường</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toàn bộ lịch sử các trận đấu trí</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  disabled={isExporting || loading}
                  className="rounded-xl border-slate-200 h-10 px-4 gap-2 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  {isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Xuất Excel</span>
                </Button>
                <Button variant="outline" onClick={() => { setPagination(p => ({ ...p, pageIndex: 0 })); fetchData(); }} className="h-10 w-10 p-0 rounded-xl border-slate-200">
                  <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Tìm kiếm người chơi..." 
                  className="pl-10 h-10 border-none bg-slate-50 rounded-xl font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-10 rounded-xl gap-2 border-slate-200 text-xs font-bold w-full sm:w-auto hover:bg-slate-50">
                <Filter size={14} /> <span>Tất cả chế độ</span>
              </Button>
            </div>

            {/* Grid of Matches */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleViewDetail(log)}
                  className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
                >
                   {/* Background Glow */}
                   <div className={cn(
                     "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-5 pointer-events-none",
                     log.mode === "PVP" ? "bg-indigo-600" : "bg-orange-600"
                   )} />

                   <div className="flex justify-between items-start relative z-10">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight",
                        log.mode === "PVP" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                      )}>
                        {log.mode === "PVP" ? "Đối kháng PvP" : "Thách đấu AI"}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "---"}
                      </span>
                   </div>

                   <div className="flex items-center justify-between gap-2 relative z-10">
                      <PlayerMiniCard player={log.player1} />
                      
                      <div className="flex flex-col items-center shrink-0 px-2">
                         <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-inner italic">vs</div>
                      </div>

                      <PlayerMiniCard player={log.player2} isRight />
                   </div>

                   <div className="pt-4 border-t border-dashed border-slate-100 flex items-center justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1">Chủ đề</span>
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px] uppercase leading-tight">{log.topic}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                   </div>
                </motion.div>
              ))}
              {logs.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center text-slate-400 font-bold italic text-sm">
                  Chưa có dữ liệu trận đấu nào.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {logs.length > 0 && (
              <div className="mt-8">
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
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <Button 
              variant="ghost" 
              onClick={() => setView("list")}
              className="gap-2 text-slate-500 hover:text-sky-600 rounded-xl"
            >
              <ArrowLeft size={16} /> Quay lại danh sách
            </Button>

            {selectedMatch && (
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <Trophy size={150} className="text-orange-500" />
                </div>

                <div className="text-center space-y-4 relative z-10">
                   <div className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-sky-100">Chi tiết trận đấu trí</div>
                   <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-tight leading-tight">
                     {selectedMatch.player1.displayName} vs {selectedMatch.player2.displayName}
                   </h2>
                   <div className="flex items-center justify-center gap-4 text-slate-400 font-bold text-xs sm:text-sm">
                      <Calendar size={16} />
                      <span>{selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : "---"}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                   <div className={cn(
                     "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 relative overflow-hidden",
                     selectedMatch.player1.winner ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                   )}>
                      {selectedMatch.player1.winner && (
                         <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-bl-xl shadow-lg">
                           <Trophy size={16} />
                         </div>
                      )}
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-800 text-xl font-bold uppercase">
                        {selectedMatch.player1.displayName?.[0] || "?"}
                      </div>
                      <p className="text-sm font-bold text-slate-900 uppercase">{selectedMatch.player1.displayName}</p>
                      <div className="text-4xl font-bold text-emerald-600 leading-tight">{selectedMatch.player1.score ?? 0}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm đạt được</p>
                      <div className="mt-2 text-[10px] font-bold text-slate-500">+{selectedMatch.player1.xpEarned} EXP</div>
                   </div>

                   <div className={cn(
                     "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 relative overflow-hidden",
                     selectedMatch.player2.winner ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                   )}>
                      {selectedMatch.player2.winner && (
                         <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-bl-xl shadow-lg">
                           <Trophy size={16} />
                         </div>
                      )}
                      <div className={cn(
                        "w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-xl font-bold uppercase",
                        selectedMatch.player2.id === null ? "bg-slate-900 text-white" : "bg-white text-slate-800"
                      )}>
                        {selectedMatch.player2.id === null ? <Bot size={32} /> : (selectedMatch.player2.displayName?.[0] || "?")}
                      </div>
                      <p className="text-sm font-bold text-slate-900 uppercase">{selectedMatch.player2.displayName}</p>
                      <div className="text-4xl font-bold text-emerald-600 leading-tight">{selectedMatch.player2.score ?? 0}</div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm đạt được</p>
                      <div className="mt-2 text-[10px] font-bold text-slate-500">+{selectedMatch.player2.xpEarned} EXP</div>
                   </div>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-6 sm:p-8 space-y-6">
                   <div className="flex items-center gap-3">
                      <Zap size={20} className="text-sky-500" />
                      <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight">Thông tin chủ đề</h4>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5">Chủ đề thách đấu</p>
                         <p className="text-sm font-bold text-slate-700 uppercase">{selectedMatch.topic}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5">Chế độ</p>
                         <p className={cn(
                           "text-sm font-bold",
                           selectedMatch.mode === "PVP" ? "text-indigo-600" : "text-orange-600"
                         )}>
                           {selectedMatch.mode === "PVP" ? "Đối kháng 1 vs 1" : "Thách đấu Trí tuệ AI"}
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
