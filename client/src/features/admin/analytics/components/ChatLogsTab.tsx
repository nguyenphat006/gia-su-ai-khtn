import * as React from "react"
import { Search, RefreshCcw, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { ChatLog } from "../types"

interface ChatLogsTabProps {
  chatLogs: ChatLog[]
  loading: boolean
  pagination: any
  setPagination: (p: any) => void
  totalPages: number
  totalLogs: number
  fetchChatLogs: () => void
  onViewDetail: (log: ChatLog) => void
}

export function ChatLogsTab({ 
  chatLogs, 
  loading, 
  pagination, 
  setPagination, 
  totalPages, 
  totalLogs, 
  fetchChatLogs,
  onViewDetail
}: ChatLogsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Tìm kiếm nội dung hội thoại..." className="pl-10 h-10 rounded-xl font-bold" />
        </div>
        <Button variant="outline" onClick={fetchChatLogs} className="h-10 rounded-xl gap-2 border-slate-200">
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
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => onViewDetail(log)}>
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
           </tbody>
         </table>
      </div>

      {chatLogs.length > 0 && (
        <div className="mt-4">
          <DataTablePagination 
            table={{
              getState: () => ({ pagination }),
              setPageIndex: (index: number) => setPagination((prev: any) => ({ ...prev, pageIndex: index })),
              setPageSize: (size: number) => setPagination((prev: any) => ({ ...prev, pageSize: size, pageIndex: 0 })),
              getPageCount: () => totalPages,
              getCanPreviousPage: () => pagination.pageIndex > 0,
              getCanNextPage: () => pagination.pageIndex < totalPages - 1,
              previousPage: () => setPagination((prev: any) => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
              nextPage: () => setPagination((prev: any) => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
              getFilteredSelectedRowModel: () => ({ rows: [] })
            } as any}
            totalCount={totalLogs}
          />
        </div>
      )}
    </div>
  )
}
