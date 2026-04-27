import { motion } from "motion/react";
import { Medal, AlertCircle } from "lucide-react";

interface MatchingScreenProps {
  isAiMode: boolean;
  battleData: any;
  errorMsg: string;
  onCancel: () => void;
  onRetry: () => void;
}

export function MatchingScreen({ isAiMode, battleData, errorMsg, onCancel, onRetry }: MatchingScreenProps) {
  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col items-center justify-center relative px-6 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-12">
        {errorMsg ? (
          <div className="bg-red-50 border-2 border-red-100 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
             <div className="absolute top-4 right-4 text-red-100"><AlertCircle size={80} /></div>
             <div className="relative z-10">
                <h3 className="text-2xl font-display font-black text-red-900 mb-6 uppercase tracking-tight">Rất tiếc, có chút vấn đề rồi!</h3>
                <p className="text-red-700 font-bold text-lg mb-10 leading-relaxed italic">"{errorMsg}"</p>
                <button onClick={onRetry} className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all uppercase tracking-widest text-[11px]">Thử chọn chủ đề khác</button>
             </div>
          </div>
        ) : (
          <>
            <div className="relative">
               <div className="absolute inset-0 bg-sky-200 rounded-full blur-[80px] opacity-40 animate-pulse" />
               <div className="w-40 h-40 bg-sky-600 rounded-[3rem] flex items-center justify-center text-white relative z-10 mx-auto shadow-[0_20px_50px_-15px_rgba(13,148,136,0.5)] rotate-12">
                  <Medal size={80} className="animate-bounce" />
               </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl md:text-5xl font-display font-black text-sky-900 tracking-tight uppercase leading-tight max-w-4xl mx-auto px-4">
                {isAiMode ? "Đề thi đang sẵn sàng. Chúc em may mắn!" : 
                 battleData?.target ? `Đang chờ ${battleData.target.username} phản hồi...` : "Đề thi đang sẵn sàng..."}
              </h3>
              <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-[11px]">
                {isAiMode ? "Vui lòng đợi trong giây lát" : "Chuẩn bị vào đấu trường"}
              </p>
            </div>
            <div className="flex justify-center gap-2">
               {[1,2,3].map(i => (
                  <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-3 h-3 bg-sky-500 rounded-full" />
               ))}
            </div>
            <button onClick={onCancel} className="px-10 py-4 bg-white text-slate-400 font-black rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all border-2 border-slate-100 shadow-sm uppercase tracking-widest text-[10px]">Hủy và quay về sảnh</button>
          </>
        )}
      </motion.div>
    </div>
  );
}
