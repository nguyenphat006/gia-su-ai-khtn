import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActivityTimeStat } from "../types"

const DAYS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

interface StudyHeatmapProps {
  activityTime: ActivityTimeStat[]
}

export function StudyHeatmap({ activityTime }: StudyHeatmapProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{ day: number, hour: number } | null>(null);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-slate-50";
    if (count < 5) return "bg-sky-100";
    if (count < 10) return "bg-sky-200";
    if (count < 20) return "bg-sky-300";
    if (count < 50) return "bg-sky-400";
    return "bg-sky-600";
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 border border-sky-100 shadow-sm">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight mb-1">Ma trận thời điểm học tập</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phân tích hoạt động theo Thứ và Giờ</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Ít</span>
              <div className="flex gap-1">
                 <div className="w-3 h-3 rounded-sm bg-slate-50 border border-slate-100"></div>
                 <div className="w-3 h-3 rounded-sm bg-sky-100"></div>
                 <div className="w-3 h-3 rounded-sm bg-sky-300"></div>
                 <div className="w-3 h-3 rounded-sm bg-sky-600"></div>
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Nhiều</span>
           </div>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[800px] space-y-1">
          <div className="flex ml-16 mb-2">
             {Array.from({ length: 24 }).map((_, h) => (
               <div key={h} className="flex-1 text-center text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                 {h}h
               </div>
             ))}
          </div>

          {Array.from({ length: 7 }).map((_, day) => (
            <div key={day} className="flex items-center gap-2">
               <div className="w-14 text-right pr-2">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{DAYS[day]}</span>
               </div>
               <div className="flex-1 flex gap-1 h-8 sm:h-10">
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const cellData = activityTime?.find(s => 
                      (s.hour === hour || (s as any).hourOfDay === hour) && 
                      (s.dayOfWeek === day)
                    );
                    const count = cellData ? (cellData.count || (cellData as any).actionCount || 0) : 0;
                    const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour;

                    return (
                      <div 
                        key={hour}
                        className="flex-1 relative group"
                        onMouseEnter={() => setHoveredCell({ day, hour })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                         <motion.div 
                           initial={false}
                           animate={{ scale: isHovered ? 1.1 : 1 }}
                           className={cn(
                             "w-full h-full rounded-md border border-white/20 transition-colors duration-300 cursor-pointer",
                             getHeatmapColor(count),
                             isHovered && "ring-2 ring-sky-500 ring-offset-1 z-10 shadow-lg"
                           )}
                         />
                         
                         <AnimatePresence>
                           {isHovered && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10, scale: 0.9 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: -10, scale: 0.9 }}
                               className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white p-2 rounded-lg z-50 shadow-2xl min-w-[120px] pointer-events-none text-center"
                             >
                               <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{DAYS[day]}, {hour}:00</p>
                               <div className="flex items-center justify-center gap-2">
                                  <span className="text-xs font-bold">{count}</span>
                                  <span className="text-[7px] font-bold text-sky-400 uppercase tracking-widest">Tương tác</span>
                               </div>
                               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                    );
                  })}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
