import { motion } from "motion/react"
import { ArrowLeft, Trophy, Calendar, Zap, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArenaLogDetail } from "../types"

interface ArenaLogDetailViewProps {
  selectedMatch: ArenaLogDetail | null
  onBack: () => void
}

export function ArenaLogDetailView({ selectedMatch, onBack }: ArenaLogDetailViewProps) {
  if (!selectedMatch) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="gap-2 text-slate-500 hover:text-sky-600 rounded-xl"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Button>

      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Trophy size={150} className="text-orange-500" />
        </div>

        <div className="text-center space-y-4 relative z-10">
           <div className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-sky-100">Chi tiết trận đấu trí</div>
           <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-tight leading-tight">
             {selectedMatch.player1.displayName} vs {selectedMatch.player2.displayName}
           </h2>
           <div className="flex items-center justify-center gap-4 text-slate-400 font-bold text-xs sm:text-sm">
              <Calendar size={16} />
              <span>{selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : "---"}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
           <div className={cn(
             "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 relative overflow-hidden",
             selectedMatch.player1.winner ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
           )}>
              {selectedMatch.player1.winner && (
                 <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-bl-xl shadow-lg">
                   <Trophy size={16} />
                 </div>
              )}
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-800 text-xl font-bold uppercase">
                {selectedMatch.player1.displayName?.[0] || "?"}
              </div>
              <p className="text-sm font-bold text-slate-900 uppercase">{selectedMatch.player1.displayName}</p>
              <div className="text-4xl font-bold text-emerald-600 leading-tight">{selectedMatch.player1.score ?? 0}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm đạt được</p>
              <div className="mt-2 text-[10px] font-bold text-slate-500">+{selectedMatch.player1.xpEarned} EXP</div>
           </div>

           <div className={cn(
             "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 relative overflow-hidden",
             selectedMatch.player2.winner ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
           )}>
              {selectedMatch.player2.winner && (
                 <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-bl-xl shadow-lg">
                   <Trophy size={16} />
                 </div>
              )}
              <div className={cn(
                "w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-xl font-bold uppercase",
                selectedMatch.player2.id === null ? "bg-slate-900 text-white" : "bg-white text-slate-800"
              )}>
                {selectedMatch.player2.id === null ? <Bot size={32} /> : (selectedMatch.player2.displayName?.[0] || "?")}
              </div>
              <p className="text-sm font-bold text-slate-900 uppercase">{selectedMatch.player2.displayName}</p>
              <div className="text-4xl font-bold text-emerald-600 leading-tight">{selectedMatch.player2.score ?? 0}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm đạt được</p>
              <div className="mt-2 text-[10px] font-bold text-slate-500">+{selectedMatch.player2.xpEarned} EXP</div>
           </div>
        </div>

        <div className="bg-slate-50 rounded-[2rem] p-6 sm:p-8 space-y-6">
           <div className="flex items-center gap-3">
              <Zap size={20} className="text-sky-500" />
              <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight leading-tight">Thông tin chủ đề</h4>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5">Chủ đề thách đấu</p>
                 <p className="text-sm font-bold text-slate-700 uppercase">{selectedMatch.topic}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5">Chế độ</p>
                 <p className={cn(
                   "text-sm font-bold",
                   selectedMatch.mode === "PVP" ? "text-indigo-600" : "text-orange-600"
                 )}>
                   {selectedMatch.mode === "PVP" ? "Đối kháng 1 vs 1" : "Thách đấu Trí tuệ AI"}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
