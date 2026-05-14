import { motion } from "motion/react";
import { Trophy, Sword, RefreshCw, BookOpen, Sparkles, Loader2, User as UserIcon, Bot } from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import { BattleConfig } from "../types";

function ResultCard({ name, score, winner, isOpponent = false }: any) {
  return (
    <div className={cn("p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 transition-all relative overflow-hidden", winner ? "bg-orange-50 border-orange-200 shadow-md shadow-orange-100" : "bg-slate-50 border-slate-100")}>
       {winner && (<div className="absolute -top-2 -right-2 w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white rotate-12 shadow-md shrink-0"><Trophy size={16} /></div>)}
       <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className={cn("w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-base shadow-md border shrink-0", winner ? "bg-orange-400 text-white border-orange-300" : "bg-slate-300 text-white border-slate-200")}>{isOpponent ? <Bot size={20} /> : <UserIcon size={20} />}</div>
          <div className="text-left min-w-0">
             <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{isOpponent ? "Đối thủ" : "Chiến binh"}</p>
             <h4 className="text-xs sm:text-base font-bold text-sky-900 uppercase tracking-tight truncate leading-tight">{name}</h4>
             <div className="flex items-center gap-2 mt-1 sm:mt-2"><p className="text-xl sm:text-3xl font-bold text-sky-600 leading-none">{score}</p><p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest">EXP</p></div>
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
    <div className="max-w-6xl mx-auto py-2 sm:py-6 px-3 sm:px-4 h-full overflow-y-auto no-scrollbar">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 border border-sky-50 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 hidden sm:block"><Trophy size={150} className="text-orange-500" /></div>
         <div className="text-center mb-6 sm:mb-10 relative z-10">
            <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-sky-50 text-sky-600 rounded-full font-bold text-[8px] sm:text-[10px] uppercase tracking-widest border border-sky-100 mb-3 sm:mb-4">Kết quả trận đấu</div>
            <h2 className="text-xl sm:text-3xl font-bold text-sky-900 mb-1 sm:mb-2 uppercase tracking-tight leading-tight">{winner ? "THẮNG LỢI!" : "CỐ GẮNG LÊN!"}</h2>
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[8px] sm:text-xs"><Sword size={12} /><span>{isAiMode ? `Thách đấu AI (${battleConfig.topic})` : "Đối kháng trực tiếp"}</span></div>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-10 relative z-10">
            <ResultCard name={studentName} score={myScore} winner={winner} />
            <ResultCard name={battleData.opponent.username} score={oppScore} winner={!winner} isOpponent />
         </div>

         {loadingReport ? (
           <div className="p-6 sm:p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-6"><Loader2 className="animate-spin mx-auto mb-2 text-sky-600" size={24} /><p className="text-[10px] sm:text-xs font-bold text-black italic">AI đang phân tích...</p></div>
         ) : performanceReport && isAiMode && (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 sm:mb-10 p-5 sm:p-8 bg-sky-900 text-white rounded-2xl sm:rounded-[2rem] shadow-xl relative overflow-hidden">
              <Sparkles size={32} className="absolute top-4 right-4 text-orange-300 opacity-10" />
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-orange-300" /><h4 className="text-sm sm:text-lg font-bold uppercase tracking-tight">AI PHÂN TÍCH</h4></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/10 text-center"><p className="text-[8px] font-bold uppercase tracking-widest text-white/50 mb-1">Điểm số</p><p className="text-3xl sm:text-4xl font-bold text-orange-400 leading-none">{performanceReport.score}<span className="text-base text-white/50 ml-1">/10</span></p></div>
                    <div className="md:col-span-2 space-y-3 sm:space-y-4">
                       <div><p className="text-[8px] font-bold uppercase tracking-widest text-white/50 mb-1">Phân tích:</p><p className="text-[11px] sm:text-sm font-medium leading-relaxed italic text-sky-50 line-clamp-3">"{performanceReport.analysis}"</p></div>
                       <div className="pt-3 border-t border-white/10 flex items-start gap-2"><BookOpen size={14} className="text-orange-400 shrink-0 mt-0.5" /><div><p className="text-[8px] font-bold uppercase tracking-widest text-white/50 mb-1">Lời khuyên:</p><p className="text-[11px] sm:text-sm text-white/90 leading-relaxed font-bold">{performanceReport.advice}</p></div></div>
                    </div>
                 </div>
              </div>
           </motion.div>
         )}

         <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <button onClick={onBackToLobby} className="w-full sm:w-auto px-6 py-3 bg-sky-600 text-white rounded-xl font-bold shadow-md hover:bg-sky-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] sm:text-[10px] active:scale-95"><RefreshCw size={14} />Đấu trận mới</button>
            <button onClick={onBackToLobby} className="w-full sm:w-auto px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-[9px] sm:text-[10px] active:scale-95">Về sảnh</button>
         </div>
      </motion.div>
    </div>
  );
}
