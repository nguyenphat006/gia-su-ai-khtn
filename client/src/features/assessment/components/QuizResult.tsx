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
    <div className="flex flex-col items-center justify-center py-10 h-full text-center px-4 overflow-y-auto custom-scrollbar">
       <div className="w-24 h-24 bg-orange-50 mx-auto rounded-3xl flex items-center justify-center text-orange-500 mb-6 border border-orange-100 shadow-sm shrink-0">
          <Trophy size={48} />
       </div>
       <h2 className="text-3xl font-display font-black text-sky-900 mb-2 shrink-0">Chúc mừng em!</h2>
       <p className="text-black mb-8 font-bold italic shrink-0">Em đã hoàn thành thử thách ôn tập chủ đề **{topic}**</p>
       
       <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8 shrink-0">
          <div className="bg-white p-6 rounded-3xl border border-sky-50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
             <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-1 text-left">Tiềm năng</p>
             <p className="text-3xl font-display font-black text-sky-900 text-left">+{score * 10}<span className="text-sm ml-1">EXP</span></p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-sky-50 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
             <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-1 text-left">Chính xác</p>
             <p className="text-3xl font-display font-black text-orange-900 text-left">{Math.round((score/totalQuizzes)*100)}%</p>
          </div>
       </div>

       {loadingReport ? (
         <div className="w-full max-w-md p-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 mb-8 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-sky-600" size={32} />
            <p className="text-sm font-bold text-black italic">AI đang phân tích bài làm của em...</p>
         </div>
       ) : performanceReport && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-2xl bg-sky-900 text-white rounded-[2.5rem] p-10 mb-8 relative overflow-hidden text-left"
         >
            <Sparkles className="absolute top-4 right-4 text-orange-300 opacity-20" size={48} />
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="text-orange-300" size={20} />
                  <h4 className="text-lg font-display font-black uppercase tracking-tight">AI PHÂN TÍCH TIẾN TRÌNH</h4>
               </div>
               <div className="space-y-6">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-2">Chấm điểm chi tiết:</p>
                     <p className="text-4xl font-display font-black text-orange-400">{performanceReport.score}<span className="text-xl text-white/50 ml-2">/10</span></p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-2">Phân tích lỗ hổng kiến thức:</p>
                     <p className="text-sm font-medium italic leading-relaxed">"{performanceReport.analysis}"</p>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-2">Lời khuyên từ cô Trang:</p>
                     <p className="text-sm font-bold text-white/90 leading-relaxed">{performanceReport.advice}</p>
                  </div>
               </div>
            </div>
         </motion.div>
       )}

       <div className="flex flex-col gap-3 w-full max-w-md shrink-0">
          <button 
            onClick={startQuiz}
            className="w-full bg-sky-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-sky-200/50 hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
          >
            Làm lại với thử thách khác
            <RefreshCw size={18} />
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => setMode("menu")}
              className="flex-1 bg-white text-slate-600 font-bold py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Quay về menu
            </button>
            <button 
              onClick={() => setMode("chat")}
              className="flex-1 bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200/50 hover:bg-orange-600 transition-all text-xs"
            >
              Hỏi Trợ lý học tập
            </button>
          </div>
       </div>
    </div>
  );
}
