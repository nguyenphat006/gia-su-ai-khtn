import { motion } from "motion/react";
import { Trophy, Sword, RefreshCw, BookOpen, Sparkles, Loader2, User as UserIcon, Bot } from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import { BattleConfig } from "../types";

function ResultCard({ name, score, winner, isOpponent = false }: any) {
  return (
    <div className={cn("p-10 rounded-[2.5rem] border-4 transition-all relative overflow-hidden", winner ? "bg-orange-50 border-orange-200 shadow-2xl shadow-orange-100" : "bg-slate-50 border-slate-100")}>
       {winner && (<div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-400 rounded-full flex items-center justify-center text-white rotate-12 shadow-lg"><Trophy size={48} /></div>)}
       <div className="flex items-center gap-6 relative z-10">
          <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-display font-black text-xl shadow-lg border-4", winner ? "bg-orange-400 text-white border-orange-300" : "bg-slate-300 text-white border-slate-200")}>{isOpponent ? <Bot size={40} /> : <UserIcon size={40} />}</div>
          <div className="text-left">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{isOpponent ? "Đối thủ" : "Chiến binh"}</p>
             <h4 className="text-2xl font-display font-black text-sky-900 uppercase tracking-tight">{name}</h4>
             <div className="flex items-center gap-3 mt-4"><p className="text-5xl font-display font-black text-sky-600 leading-none">{score}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Điểm đấu</p></div>
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
    <div className="max-w-6xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] p-8 md:p-16 border border-sky-50 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-10"><Trophy size={200} className="text-orange-500" /></div>
         <div className="text-center mb-16 relative z-10">
            <div className="inline-block px-8 py-3 bg-sky-50 text-sky-600 rounded-full font-black text-xs uppercase tracking-widest border border-sky-100 mb-6">Kết quả trận đấu</div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-sky-900 mb-4">{winner ? "CHIẾN THẮNG TUYỆT VỜI!" : "MỘT TRẬN ĐẤU CỐ GẮNG!"}</h2>
            <div className="flex items-center justify-center gap-4 text-slate-400 font-bold"><Sword size={20} /><span>Chế độ: {isAiMode ? `Thách đấu AI (${battleConfig.topic})` : "Đối kháng trực tiếp"}</span></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 relative z-10">
            <ResultCard name={studentName} score={myScore} winner={winner} />
            <ResultCard name={battleData.opponent.username} score={oppScore} winner={!winner} isOpponent />
         </div>

         {loadingReport ? (
           <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200"><Loader2 className="animate-spin mx-auto mb-4 text-sky-600" size={32} /><p className="font-bold text-black italic">AI đang phân tích bài làm...</p></div>
         ) : performanceReport && isAiMode && (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-16 p-12 bg-sky-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <Sparkles className="absolute top-8 right-8 text-orange-300 opacity-30" size={64} />
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><Sparkles className="text-orange-300" /></div><h4 className="text-2xl font-display font-black uppercase tracking-tight">AI PHÂN TÍCH KẾT QUẢ</h4></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Chốt điểm</p><p className="text-6xl font-display font-black text-orange-400">{performanceReport.score}<span className="text-2xl text-white/50 ml-2">/10</span></p></div>
                    <div className="md:col-span-2 space-y-6">
                       <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Phân tích lỗ hổng:</p><p className="text-lg font-medium leading-relaxed italic">"{performanceReport.analysis}"</p></div>
                       <div className="pt-6 border-t border-white/10 flex items-start gap-4"><BookOpen className="text-orange-400 shrink-0" /><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Lời khuyên:</p><p className="text-sm text-white/80 leading-relaxed font-bold">{performanceReport.advice}</p></div></div>
                    </div>
                 </div>
              </div>
           </motion.div>
         )}

         <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button onClick={onBackToLobby} className="px-10 py-5 bg-sky-600 text-white rounded-2xl font-black shadow-xl shadow-sky-200 hover:bg-sky-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"><RefreshCw size={18} />Thách đấu trận mới</button>
            <button onClick={onBackToLobby} className="px-10 py-5 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Quay về sảnh đấu</button>
         </div>
      </motion.div>
    </div>
  );
}
