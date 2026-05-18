import * as React from "react"
import { Trophy, RefreshCcw, Swords, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { adminAnalyticsService } from "../../services/analytics.service"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface StudentArenaTabProps {
  userId: string
}

export function StudentArenaTab({ userId }: StudentArenaTabProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  const fetchArenaLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAnalyticsService.getArenaLogs({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        userId: userId
      });
      setData(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalLogs(res.data.pagination.total);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử đấu trường:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    fetchArenaLogs();
  }, [fetchArenaLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={14} className="text-purple-500" />
          Lịch sử Đấu trường
        </h4>
        <Button variant="outline" size="sm" onClick={fetchArenaLogs} disabled={loading} className="h-8 rounded-lg gap-2 text-[10px] font-bold">
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chế độ</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đối thủ</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Kết quả</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((log) => {
              const isPlayer1 = log.player1.id === userId;
              const me = isPlayer1 ? log.player1 : log.player2;
              const opponent = isPlayer1 ? log.player2 : log.player1;
              
              return (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-slate-500">
                      {format(new Date(log.createdAt), "HH:mm, dd/MM", { locale: vi })}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {log.mode === "PVP" ? (
                        <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500"><Swords size={12} /></div>
                      ) : (
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500"><Bot size={12} /></div>
                      )}
                      <span className="text-[10px] font-black uppercase text-slate-600">{log.mode}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 uppercase">{opponent.displayName}</span>
                      <span className="text-[9px] font-bold text-slate-400">{log.topic}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-1 rounded-lg border",
                      me.winner 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {me.winner ? "Thắng" : "Thua"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs font-black text-emerald-600">+{me.xpEarned}</span>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic text-xs">Chưa có dữ liệu thi đấu nào.</td>
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
