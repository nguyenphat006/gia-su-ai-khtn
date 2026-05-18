import * as React from "react"
import { Search, RefreshCcw, BookOpen, Brain, Trophy, Zap, MessageSquare, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/DataTable/DataTablePagination"
import { useNavigate } from "react-router-dom"

interface QuizLogsTabProps {
  studentStats: any[]
  loading: boolean
  studentPagination: any
  setStudentPagination: (p: any) => void
  studentTotalPages: number
  studentTotalLogs: number
  studentSearch: string
  setStudentSearch: (s: string) => void
  fetchStudentStats: () => void
}

export function QuizLogsTab({ 
  studentStats, 
  loading, 
  studentPagination, 
  setStudentPagination, 
  studentTotalPages, 
  studentTotalLogs, 
  studentSearch,
  setStudentSearch,
  fetchStudentStats 
}: QuizLogsTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm học sinh (Tên, Mã HS, Lớp)..." 
            className="pl-10 h-10 rounded-xl font-bold" 
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudentStats()}
          />
        </div>
        <Button variant="outline" onClick={fetchStudentStats} className="h-10 rounded-xl gap-2 border-slate-200">
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> <span>Làm mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
         <table className="w-full text-left border-collapse">
           <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học sinh</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Chat AI</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sơ đồ tư duy</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Flashcard</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Đấu trường</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Điểm EXP</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Chuỗi ngày</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {studentStats?.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/admin/analytics/students/${student.id}`)}
                >
                  <td className="p-4">
                     <div className="flex flex-col">
                       <span className="text-xs font-black text-slate-700 uppercase group-hover:text-sky-600 transition-colors">{student.displayName}</span>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded uppercase">{student.studentCode}</span>
                         <span className="text-[9px] font-bold text-sky-600 px-1.5 py-0.5 bg-sky-50 rounded uppercase">{student.className}</span>
                       </div>
                     </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-sky-600">
                        <MessageSquare size={12} />
                        <span className="text-xs font-black">{student.stats.aiChatCount}</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Tin nhắn</span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Brain size={12} />
                        <span className="text-xs font-black">{student.stats.mindmapCount}</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Hoàn thành</span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-orange-600">
                        <BookOpen size={12} />
                        <span className="text-xs font-black">{student.stats.flashcardCount}</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Đã học</span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Trophy size={12} />
                        <span className="text-xs font-black">{student.stats.arenaCount}</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Trận đấu</span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                     <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                        <Zap size={10} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-amber-700">{student.stats.totalXp.toLocaleString()}</span>
                     </div>
                  </td>

                  <td className="p-4 text-center">
                     <div className="flex items-center justify-center gap-1 text-rose-600">
                        <span className="text-xs font-black">{student.stats.currentStreak}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Ngày</span>
                     </div>
                  </td>

                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight size={16} className="text-slate-400" />
                    </Button>
                  </td>
                </tr>
              ))}
              {studentStats.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-bold italic text-xs">Không tìm thấy dữ liệu thống kê học sinh nào.</td>
                </tr>
              )}
           </tbody>
         </table>
      </div>

      {studentStats.length > 0 && (
        <div className="mt-4">
          <DataTablePagination 
            table={{
              getState: () => ({ pagination: studentPagination }),
              setPageIndex: (index: number) => setStudentPagination((prev: any) => ({ ...prev, pageIndex: index })),
              setPageSize: (size: number) => setStudentPagination((prev: any) => ({ ...prev, pageSize: size, pageIndex: 0 })),
              getPageCount: () => studentTotalPages,
              getCanPreviousPage: () => studentPagination.pageIndex > 0,
              getCanNextPage: () => studentPagination.pageIndex < studentTotalPages - 1,
              previousPage: () => setStudentPagination((prev: any) => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
              nextPage: () => setStudentPagination((prev: any) => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
              getFilteredSelectedRowModel: () => ({ rows: [] })
            } as any}
            totalCount={studentTotalLogs}
          />
        </div>
      )}
    </div>
  )
}
