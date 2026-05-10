import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  Swords, 
  Search, 
  RefreshCcw, 
  Download,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminAnalyticsService } from "@/features/admin/analytics/services/analytics.service"
import { ArenaLog, ArenaLogDetail } from "@/features/admin/analytics/types"
import { toast } from "sonner"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"

// Sub-components
import { ArenaLogCard } from "./components/ArenaLogCard"
import { ArenaLogDetailView } from "./components/ArenaLogDetailView"

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
                <ArenaLogCard 
                  key={log.id} 
                  log={log} 
                  onClick={() => handleViewDetail(log)} 
                />
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
          <ArenaLogDetailView 
            selectedMatch={selectedMatch} 
            onBack={() => setView("list")} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
