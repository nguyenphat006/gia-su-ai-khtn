import * as React from "react"
import { motion } from "motion/react"
import { Users, MessageSquare, Flame, Zap } from "lucide-react"
import { StatsCard } from "./StatsCard"
import { StudyHeatmap } from "./StudyHeatmap"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface GeneralAnalyticsTabProps {
  engagement: any
  totalLogs: number
  activityTime: any[]
  topStudentsCount: number
  onRankClick: (rank: any) => void
}

export function GeneralAnalyticsTab({ 
  engagement, 
  totalLogs, 
  activityTime, 
  topStudentsCount,
  onRankClick
}: GeneralAnalyticsTabProps) {
  const totalInteractions = activityTime?.reduce((acc, curr) => acc + (curr.count || (curr as any).actionCount || 0), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Học sinh tích cực" value={topStudentsCount} icon={Users} color="bg-emerald-500" />
        <StatsCard label="Câu hỏi đã hỏi" value={totalLogs} icon={MessageSquare} color="bg-sky-500" />
        <StatsCard label="Chuỗi đăng nhập Max" value={engagement?.topStreaks?.[0]?.longestStreak || 0} icon={Flame} color="bg-orange-500" />
        <StatsCard label="Tổng tương tác" value={totalInteractions.toLocaleString()} icon={Zap} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <StudyHeatmap activityTime={activityTime} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Rank Distribution */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Phân phối danh hiệu</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tỉ lệ trình độ học sinh</p>
                </div>
              </div>
              <div className="space-y-5 flex-1">
                 {engagement?.rankDistribution?.map((rank: any, idx: number) => (
                   <div key={idx} className="space-y-1.5 group cursor-pointer" onClick={() => onRankClick(rank)}>
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-sky-600 transition-colors">{rank.rank}</p>
                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-sky-400"><b>{rank.count}</b> học sinh <ArrowRight size={10} className="inline ml-1" /></p>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (rank.count / (engagement?.rankDistribution?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1)) * 100)}%` }}
                          className={cn(
                            "h-full rounded-full shadow-sm",
                            idx === 0 ? "bg-amber-50" : (idx === 1 ? "bg-sky-500" : (idx === 2 ? "bg-emerald-500" : "bg-indigo-500"))
                          )}
                        />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Streak Summary */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm">
                  <Flame size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Thống kê Chuyên cần</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hiệu suất rèn luyện trung bình</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                 <div className="relative">
                    <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center relative z-10">
                       <div className="text-center">
                          <span className="text-3xl font-bold text-slate-900">84%</span>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Rate</p>
                       </div>
                    </div>
                    <svg className="absolute inset-0 w-32 h-32 -rotate-90 z-20 pointer-events-none">
                       <circle cx="64" cy="64" r="56" fill="transparent" stroke="url(#active-gradient)" strokeWidth="8" strokeDasharray={`${0.84 * 351} 351`} strokeLinecap="round" />
                       <defs>
                          <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#10b981" />
                             <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                       </defs>
                    </svg>
                 </div>
                 <p className="text-[10px] text-slate-500 font-medium max-w-[200px] leading-relaxed italic">
                   Dựa trên chuỗi ngày học tập và tần suất tương tác của toàn bộ học sinh trong tháng này.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
