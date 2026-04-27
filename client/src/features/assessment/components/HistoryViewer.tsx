import { motion } from "motion/react";
import { ArrowLeft, Trophy, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizHistory, AssessmentMode } from "../types";

interface HistoryViewerProps {
  history: QuizHistory[];
  setMode: (mode: AssessmentMode) => void;
}

export function HistoryViewer({ history, setMode }: HistoryViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMode("menu")}
            className="p-2 hover:bg-sky-50 rounded-xl text-sky-600 transition-all border border-sky-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-display font-black text-sky-900 text-xl tracking-tight">Lịch sử bài tập</h3>
        </div>
        <div className="bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 flex items-center gap-2">
           <Trophy size={14} className="text-sky-600" />
           <span className="text-[10px] font-black text-sky-900 uppercase tracking-widest">{history.length} Thử thách</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {history.length > 0 ? history.map((record) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={record.id} 
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-sky-200 transition-all"
          >
            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-inner">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sky-900 text-lg uppercase tracking-tight">{record.topic}</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {record.createdAt?.toDate().toLocaleDateString('vi-VN', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-black text-sky-600">{record.score}<span className="text-black text-opacity-30 mx-1">/</span>{record.total}</p>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                (record.score / record.total) >= 0.8 ? "text-orange-500" : "text-sky-500"
              )}>
                {(record.score / record.total) >= 0.8 ? "Xuất sắc" : "Hoàn thành"}
              </p>
            </div>
          </motion.div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 opacity-50">
            <History size={64} />
            <p className="font-bold italic">Em chưa làm bài trắc nghiệm nào cả.</p>
          </div>
        )}
      </div>
    </div>
  );
}
