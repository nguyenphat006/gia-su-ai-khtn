import * as React from "react"
import { Trophy, Calendar, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { TopStudent } from "../types"

interface RankingTabProps {
  selectedMonth: number
  setSelectedMonth: (m: number) => void
  selectedYear: number
  topStudents: TopStudent[]
  engagement: any
  months: { value: number, label: string }[]
}

export function RankingTab({ 
  selectedMonth, 
  setSelectedMonth, 
  selectedYear, 
  topStudents, 
  engagement,
  months 
}: RankingTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Vinh danh EXP</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bảng xếp hạng theo tháng</p>
            </div>
          </div>
          
          <div className="flex gap-2">
             <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
             >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
             </select>
             <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Calendar size={12} />
                {selectedYear}
             </div>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
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
                <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight leading-tight">{s.displayName}</p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5 uppercase">@{s.username}</p>
              </div>
              <div className="text-right">
                 <p className="text-sm font-bold text-sky-600 leading-tight">{(s.xp || 0).toLocaleString()}</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">EXP</p>
              </div>
            </div>
          ))}
          {topStudents.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
               <Trophy size={48} className="mb-2" />
               <p className="text-xs font-bold uppercase tracking-widest">Chưa có dữ liệu tháng này</p>
            </div>
          )}
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
             {engagement?.topStreaks?.slice(0, 20).map((streak: any, idx: number) => (
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
    </div>
  )
}
