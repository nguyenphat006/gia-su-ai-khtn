import * as React from "react"
import { MessageSquare, RefreshCcw, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { adminAnalyticsService } from "../../services/analytics.service"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ChatLogDetailModal } from "../ChatLogDetailModal"

interface StudentChatTabProps {
  userId: string
}

export function StudentChatTab({ userId }: StudentChatTabProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  // Modal State
  const [selectedLog, setSelectedLog] = React.useState<any>(null);
  const [sessionMessages, setSessionMessages] = React.useState<any[]>([]);
  const [isLoadingSession, setIsLoadingSession] = React.useState(false);

  const fetchChatLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAnalyticsService.getChatLogs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        userId: userId
      });
      const payload = res.data as any;
      setData(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalLogs(payload.pagination?.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải nhật ký chat học sinh:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    fetchChatLogs();
  }, [fetchChatLogs]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={14} className="text-sky-500" />
          Hội thoại với Gia sư AI
        </h4>
        <Button variant="outline" size="sm" onClick={fetchChatLogs} disabled={loading} className="h-8 rounded-lg gap-2 text-[10px] font-bold">
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Câu hỏi</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chủ đề AI nhận diện</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-slate-500">
                    {format(new Date(log.createdAt), "HH:mm, dd/MM", { locale: vi })}
                  </span>
                </td>
                <td className="p-4 max-w-md">
                  <p className="text-xs font-bold text-slate-700 line-clamp-2">{log.question}</p>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-black uppercase text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">
                    {log.metadata?.topic || "Chung"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-lg hover:bg-sky-50 hover:text-sky-600"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic text-xs">Học sinh chưa đặt câu hỏi nào cho AI.</td>
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

      <ChatLogDetailModal 
        selectedLog={selectedLog} 
        onClose={() => setSelectedLog(null)} 
        isLoadingSession={isLoadingSession} 
        sessionMessages={sessionMessages} 
      />
    </div>
  );
}
