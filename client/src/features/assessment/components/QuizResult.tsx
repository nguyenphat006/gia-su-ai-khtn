import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { AssessmentMode } from "../types";

interface QuizResultProps {
  topic: string;
  score: number;
  totalQuizzes: number;
  results: boolean[];
  startQuiz: () => void;
  setMode: (mode: AssessmentMode) => void;
  saveQuizHistory: (score: number, results: boolean[]) => Promise<any>;
}

export function QuizResult({
  topic, score, totalQuizzes, results, startQuiz, setMode, saveQuizHistory
}: QuizResultProps) {
  const [loadingReport, setLoadingReport] = useState(true);
  const [performanceReport, setPerformanceReport] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      const report = await saveQuizHistory(score, results);
      if (isMounted) {
        setPerformanceReport(report);
        setLoadingReport(false);
      }
    };
    fetchReport();
    return () => { isMounted = false; };
  }, [score, results, saveQuizHistory]);

  return (
    <div className="flex flex-col items-center justify-start py-4 h-full text-center px-4 overflow-y-auto no-scrollbar">
       <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 mx-auto rounded-2xl flex items-center justify-center text-orange-500 mb-4 border border-orange-100 shadow-sm shrink-0">
          <Trophy size={32} />
       </div>
       <h2 className="text-xl sm:text-2xl font-bold text-sky-900 mb-1 shrink-0 uppercase tracking-tight">Chúc mừng em!</h2>
       <p className="text-black mb-4 font-bold italic shrink-0 text-[10px] sm:text-xs">Em đã hoàn thành thử thách ôn tập chủ đề <b>{topic}</b></p>
       
       <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4 shrink-0">
          <div className="bg-white p-4 rounded-2xl border border-sky-50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Tiềm năng</p>
             <p className="text-xl sm:text-2xl font-bold text-sky-900 text-left">+{score * 10}<span className="text-[10px] ml-1">EXP</span></p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-sky-50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Chính xác</p>
             <p className="text-xl sm:text-2xl font-bold text-orange-900 text-left">{Math.round((score/totalQuizzes)*100)}%</p>
          </div>
       </div>

       {loadingReport ? (
         <div className="w-full max-w-sm p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-4 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-sky-600" size={24} />
            <p className="text-[10px] font-bold text-black italic">AI đang phân tích bài làm của em...</p>
         </div>
       ) : performanceReport && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-lg bg-sky-900 text-white rounded-[2rem] p-6 mb-4 relative overflow-hidden text-left"
         >
            <Sparkles className="absolute top-4 right-4 text-orange-300 opacity-10" size={40} />
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-orange-300" size={16} />
                  <h4 className="text-sm font-bold uppercase tracking-tight">AI PHÂN TÍCH TIẾN TRÌNH</h4>
               </div>
               <div className="space-y-4">
                  <div>
                     <p className="text-[8px] font-bold uppercase tracking-widest text-sky-300 mb-1">Chấm điểm chi tiết:</p>
                     <p className="text-2xl font-bold text-orange-400 leading-tight">{performanceReport.score}<span className="text-base text-white/50 ml-1">/10</span></p>
                  </div>
                  <div>
                     <p className="text-[8px] font-bold uppercase tracking-widest text-sky-300 mb-1">Lỗ hổng kiến thức:</p>
                     <p className="text-[11px] font-medium italic leading-relaxed text-sky-50 line-clamp-3">"{performanceReport.analysis}"</p>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                     <p className="text-[8px] font-bold uppercase tracking-widest text-sky-300 mb-1">Lời khuyên:</p>
                     <p className="text-[11px] font-bold text-white leading-relaxed">{performanceReport.advice}</p>
                  </div>
               </div>
            </div>
         </motion.div>
       )}

       <div className="flex flex-col gap-2 w-full max-w-sm shrink-0 pb-6">
          <button 
            onClick={startQuiz}
            className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-sky-700 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider"
          >
            Làm thử thách khác
            <RefreshCw size={14} />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setMode("menu")}
              className="flex-1 bg-white text-slate-600 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-[11px] uppercase"
            >
              Quay về
            </button>
            <button 
              onClick={() => setMode("chat")}
              className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-600 transition-all text-[11px] uppercase"
            >
              Hỏi AI
            </button>
          </div>
       </div>
    </div>
  );
}
