import * as React from "react"
import { BookOpen, RefreshCcw, FileText, Brain, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { adminAnalyticsService } from "../../services/analytics.service"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface StudentRevisionTabProps {
  userId: string
}

export function StudentRevisionTab({ userId }: StudentRevisionTabProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  const fetchActivityLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAnalyticsService.getActivityLogs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        userId: userId,
        module: "revision"
      });
      const payload = res.data as any;
      setData(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalLogs(payload.pagination?.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải nhật ký ôn tập học sinh:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const getActionIcon = (action: string) => {
    if (action.includes("QUIZ")) return <FileText size={12} className="text-sky-500" />;
    if (action.includes("MINDMAP")) return <Brain size={12} className="text-emerald-500" />;
    if (action.includes("FLASHCARD")) return <Layout size={12} className="text-orange-500" />;
    return <BookOpen size={12} className="text-slate-500" />;
  };

  const formatAction = (action: string) => {
    switch (action) {
      case "START_QUIZ": return "Bắt đầu làm bài";
      case "SUBMIT_QUIZ": return "Nộp bài trắc nghiệm";
      case "VIEW_MINDMAP": return "Xem sơ đồ tư duy";
      case "START_FLASHCARD": return "Học Flashcard";
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <BookOpen size={14} className="text-emerald-500" />
          Nhật ký Ôn tập & Tri thức
        </h4>
        <Button variant="outline" size="sm" onClick={fetchActivityLogs} disabled={loading} className="h-8 rounded-lg gap-2 text-[10px] font-bold">
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hành động</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung / Chủ đề</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <span className="text-[10px] font-bold text-slate-500">
                    {format(new Date(log.createdAt), "HH:mm, dd/MM", { locale: vi })}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg">{getActionIcon(log.action)}</div>
                    <span className="text-[10px] font-black uppercase text-slate-600">{formatAction(log.action)}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs font-bold text-slate-700">{log.metadata?.topic || log.metadata?.title || "N/A"}</span>
                </td>
                <td className="p-4 text-right">
                  {log.metadata?.score !== undefined && (
                    <span className="text-[10px] font-black px-2 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                      Điểm: {log.metadata.score}/{log.metadata.totalQuestions || 10}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic text-xs">Chưa có hoạt động ôn tập nào được ghi lại.</td>
              </tr>
            )}
          </tbody>
        </table>
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
