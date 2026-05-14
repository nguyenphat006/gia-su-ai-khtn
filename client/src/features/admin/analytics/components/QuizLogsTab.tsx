import * as React from "react"
import { Search, RefreshCcw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"

interface QuizLogsTabProps {
  quizLogs: any[]
  loading: boolean
  quizPagination: any
  setQuizPagination: (p: any) => void
  quizTotalPages: number
  quizTotalLogs: number
  fetchQuizLogs: () => void
}

export function QuizLogsTab({ 
  quizLogs, 
  loading, 
  quizPagination, 
  setQuizPagination, 
  quizTotalPages, 
  quizTotalLogs, 
  fetchQuizLogs 
}: QuizLogsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Tìm kiếm học sinh làm bài..." className="pl-10 h-10 rounded-xl font-bold" />
        </div>
        <Button variant="outline" onClick={fetchQuizLogs} className="h-10 rounded-xl gap-2 border-slate-200">
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-left border-collapse">
           <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học sinh</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại bài</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kết quả</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">XP Nhận</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {quizLogs?.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-[10px] font-bold text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-700">{log.user?.displayName || "Ẩn danh"}</span>
                     </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-500">
                      {log.quizType === "CHINH_PHUC" ? "Thử thách" : "Flashcard"}
                    </span>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-sky-600">{log.correctCount}</span>
                        <span className="text-[9px] font-bold text-slate-400">/ {log.totalQuestions}</span>
                     </div>
                  </td>
                  <td className="p-4 text-right">
                     <span className="text-xs font-bold text-emerald-600">+{log.xpEarned} EXP</span>
                  </td>
                </tr>
              ))}
              {quizLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic text-xs">Chưa có nhật ký ôn tập nào.</td>
                </tr>
              )}
           </tbody>
         </table>
      </div>

      {quizLogs.length > 0 && (
        <div className="mt-4">
          <DataTablePagination 
            table={{
              getState: () => ({ pagination: quizPagination }),
              setPageIndex: (index: number) => setQuizPagination((prev: any) => ({ ...prev, pageIndex: index })),
              setPageSize: (size: number) => setQuizPagination((prev: any) => ({ ...prev, pageSize: size, pageIndex: 0 })),
              getPageCount: () => quizTotalPages,
              getCanPreviousPage: () => quizPagination.pageIndex > 0,
              getCanNextPage: () => quizPagination.pageIndex < quizTotalPages - 1,
              previousPage: () => setQuizPagination((prev: any) => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
              nextPage: () => setQuizPagination((prev: any) => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
              getFilteredSelectedRowModel: () => ({ rows: [] })
            } as any}
            totalCount={quizTotalLogs}
          />
        </div>
      )}
    </div>
  )
}
