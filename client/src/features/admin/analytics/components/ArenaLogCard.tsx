import { motion } from "motion/react"
import { Bot, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ArenaLog, ArenaPlayerInfo } from "../types"

interface PlayerMiniCardProps {
  player: ArenaPlayerInfo
  isRight?: boolean
}

function PlayerMiniCard({ player, isRight = false }: PlayerMiniCardProps) {
  const isAI = player.id === null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 sm:gap-3 flex-1 min-w-0",
      isRight ? "flex-row-reverse text-right" : "text-left"
    )}>
       <div className={cn(
         "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-white/50",
         isAI ? "bg-slate-900 text-white" : "bg-sky-50 text-sky-600 border-sky-100"
       )}>
          {isAI ? <Bot size={18} /> : (player.displayName?.[0] || "?")}
       </div>
       <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-700 truncate uppercase leading-tight mb-1">
            {player.displayName}
          </p>
          <div className={cn("flex items-center gap-1.5", isRight ? "justify-end" : "justify-start")}>
             <span className="text-[10px] font-bold text-sky-600 leading-tight">{player.score ?? 0}</span>
             {player.winner ? (
               <CheckCircle2 size={10} className="text-emerald-500" />
             ) : (
               <XCircle size={10} className="text-slate-300" />
             )}
          </div>
       </div>
    </div>
  );
}

interface ArenaLogCardProps {
  log: ArenaLog
  onClick: () => void
}

export function ArenaLogCard({ log, onClick }: ArenaLogCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
    >
       {/* Background Glow */}
       <div className={cn(
         "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-5 pointer-events-none",
         log.mode === "PVP" ? "bg-indigo-600" : "bg-orange-600"
       )} />

       <div className="flex justify-between items-start relative z-10">
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight",
            log.mode === "PVP" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-orange-50 text-orange-600 border border-orange-100"
          )}>
            {log.mode === "PVP" ? "Đối kháng PvP" : "Thách đấu AI"}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">
            {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "---"}
          </span>
       </div>

       <div className="flex items-center justify-between gap-2 relative z-10">
          <PlayerMiniCard player={log.player1} />
          
          <div className="flex flex-col items-center shrink-0 px-2">
             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-inner italic">vs</div>
          </div>

          <PlayerMiniCard player={log.player2} isRight />
       </div>

       <div className="pt-4 border-t border-dashed border-slate-100 flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1">Chủ đề</span>
            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px] uppercase leading-tight">{log.topic}</span>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
       </div>
    </motion.div>
  )
}
