import { motion } from "motion/react";
import { Trophy, Sword, RefreshCw, BookOpen, Sparkles, Loader2, User as UserIcon, Bot } from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import { BattleConfig } from "../types";

function ResultCard({ name, score, winner, isOpponent = false }: any) {
  return (
    <div className={cn("p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border-2 sm:border-4 transition-all relative overflow-hidden", winner ? "bg-orange-50 border-orange-200 shadow-xl shadow-orange-100" : "bg-slate-50 border-slate-100")}>
       {winner && (<div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-orange-400 rounded-full flex items-center justify-center text-white rotate-12 shadow-lg shrink-0"><Trophy size={24} className="sm:w-12 sm:h-12" /></div>)}
       <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          <div className={cn("w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center font-display font-black text-xl shadow-lg border-2 sm:border-4 shrink-0", winner ? "bg-orange-400 text-white border-orange-300" : "bg-slate-300 text-white border-slate-200")}>{isOpponent ? <Bot size={24} className="sm:w-10 sm:h-10" /> : <UserIcon size={24} className="sm:w-10 sm:h-10" />}</div>
          <div className="text-left min-w-0">
             <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5 sm:mb-1">{isOpponent ? "Đối thủ" : "Chiến binh"}</p>
             <h4 className="text-sm sm:text-2xl font-display font-black text-sky-900 uppercase tracking-tight truncate">{name}</h4>
             <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-4"><p className="text-2xl sm:text-5xl font-display font-black text-sky-600 leading-none">{score}</p><p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Điểm</p></div>
          </div>
       </div>
    </div>
  );
}

interface BattleResultProps {
  battleResult: any; battleData: any; socketId: string; studentName: string; totalXP: number;
  isAiMode: boolean; battleConfig: BattleConfig; loadingReport: boolean; performanceReport: any; onBackToLobby: () => void;
}

export function BattleResult({ battleResult, battleData, socketId, studentName, totalXP, isAiMode, battleConfig, loadingReport, performanceReport, onBackToLobby }: BattleResultProps) {
  const myScore = battleResult.scores[socketId];
  const oppId = Object.keys(battleResult.scores).find(id => id !== socketId);
  const oppScore = oppId ? battleResult.scores[oppId] : 0;
  const winner = myScore >= oppScore;

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-10 px-3 sm:px-4 h-full overflow-y-auto custom-scrollbar">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-16 border border-sky-50 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-5 hidden sm:block"><Trophy size={200} className="text-orange-500" /></div>
         <div className="text-center mb-8 sm:mb-16 relative z-10">
            <div className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-sky-50 text-sky-600 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest border border-sky-100 mb-4 sm:mb-6">Kết quả trận đấu</div>
            <h2 className="text-2xl sm:text-5xl font-display font-black text-sky-900 mb-2 sm:mb-4 uppercase tracking-tight leading-tight">{winner ? "THẮNG LỢI!" : "CỐ GẮNG LÊN!"}</h2>
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-slate-400 font-bold text-[9px] sm:text-base"><Sword size={14} className="sm:w-5 sm:h-5" /><span>{isAiMode ? `Thách đấu AI (${battleConfig.topic})` : "Đối kháng trực tiếp"}</span></div>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-12 mb-8 sm:mb-16 relative z-10">
            <ResultCard name={studentName} score={myScore} winner={winner} />
            <ResultCard name={battleData.opponent.username} score={oppScore} winner={!winner} isOpponent />
         </div>

         {loadingReport ? (
           <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] border border-dashed border-slate-200"><Loader2 className="animate-spin mx-auto mb-3 sm:mb-4 text-sky-600 sm:w-8 sm:h-8" size={24} /><p className="text-xs sm:text-base font-bold text-black italic">AI đang phân tích bài làm...</p></div>
         ) : performanceReport && isAiMode && (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 sm:mb-16 p-6 sm:p-12 bg-sky-900 rounded-[2rem] sm:rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <Sparkles size={48} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-orange-300 opacity-20 sm:w-16 sm:h-16" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0"><Sparkles size={18} className="text-orange-300 sm:w-5 sm:h-5" /></div><h4 className="text-lg sm:text-2xl font-display font-black uppercase tracking-tight">AI PHÂN TÍCH</h4></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    <div className="bg-white/10 p-5 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-md border border-white/10 text-center"><p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 sm:mb-3">Điểm số</p><p className="text-4xl sm:text-6xl font-display font-black text-orange-400">{performanceReport.score}<span className="text-xl sm:text-2xl text-white/50 ml-1 sm:ml-2">/10</span></p></div>
                    <div className="md:col-span-2 space-y-4 sm:space-y-6">
                       <div><p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 sm:mb-2">Phân tích:</p><p className="text-sm sm:text-lg font-medium leading-relaxed italic">"{performanceReport.analysis}"</p></div>
                       <div className="pt-4 sm:pt-6 border-t border-white/10 flex items-start gap-3 sm:gap-4"><BookOpen size={16} className="text-orange-400 shrink-0 sm:w-5 sm:h-5 mt-1" /><div><p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 sm:mb-2">Lời khuyên:</p><p className="text-xs sm:text-sm text-white/80 leading-relaxed font-bold">{performanceReport.advice}</p></div></div>
                    </div>
                 </div>
              </div>
           </motion.div>
         )}

         <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
            <button onClick={onBackToLobby} className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-sky-600 text-white rounded-xl sm:rounded-2xl font-black shadow-xl shadow-sky-200 hover:bg-sky-700 transition-all flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-widest text-[10px] sm:text-xs active:scale-95"><RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />Đấu trận mới</button>
            <button onClick={onBackToLobby} className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-600 border-2 border-slate-100 rounded-xl sm:rounded-2xl font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] sm:text-xs active:scale-95">Về sảnh</button>
         </div>
      </motion.div>
    </div>
  );
}
