import * as React from "react"
import { History, RefreshCcw, MousePointer2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { adminAnalyticsService } from "../../services/analytics.service"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface StudentActivityTabProps {
  userId: string
}

export function StudentActivityTab({ userId }: StudentActivityTabProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  const fetchActivityLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAnalyticsService.getActivityLogs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        userId: userId
      });
      const payload = res.data as any;
      setData(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalLogs(payload.pagination?.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải toàn bộ lịch sử hoạt động:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <History size={14} className="text-slate-500" />
          Dòng thời gian hoạt động
        </h4>
        <Button variant="outline" size="sm" onClick={fetchActivityLogs} disabled={loading} className="h-8 rounded-lg gap-2 text-[10px] font-bold">
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
        </Button>
      </div>

      <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {data.map((log, index) => (
          <div key={log.id} className="relative">
            <div className="absolute -left-8 top-1.5 w-6 h-6 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center z-10 shadow-sm">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {format(new Date(log.createdAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-500 rounded uppercase">
                  {log.module || "SYSTEM"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">
                Học sinh đã thực hiện hành động <span className="text-sky-600 uppercase">"{log.action}"</span>
              </p>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <pre className="text-[9px] text-slate-500 font-mono whitespace-pre-wrap">
                     {JSON.stringify(log.metadata, null, 2)}
                   </pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {data.length === 0 && !loading && (
          <div className="p-10 text-center text-slate-400 font-bold italic text-xs">Chưa có dữ liệu hoạt động.</div>
        )}
      </div>

      {data.length > 0 && (
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
      )}
    </div>
  );
}
