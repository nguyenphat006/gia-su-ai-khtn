import { motion } from "motion/react";
import { Zap, Layers, Brain, RefreshCw } from "lucide-react";
import { AssessmentMode } from "../types";

interface AssessmentMenuProps {
  errorMsg: string;
  grade: string;
  setGrade: (grade: string) => void;
  quizType: string;
  setQuizType: (type: string) => void;
  topic: string;
  setTopic: (topic: string) => void;
  quizCount: number;
  setQuizCount: (count: number) => void;
  startQuiz: () => void;
  setMode: (mode: AssessmentMode) => void;
}

export function AssessmentMenu({
  errorMsg, grade, setGrade, quizType, setQuizType, topic, setTopic, quizCount, setQuizCount, startQuiz, setMode
}: AssessmentMenuProps) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col justify-start py-4 px-3 sm:px-6 h-full min-h-0">
      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center text-xs font-bold shrink-0"
        >
          {errorMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0 pb-6 overflow-hidden">
         {/* Option 1: AI Quiz */}
         <motion.div 
           whileHover={{ y: -4 }}
           className="bg-gradient-to-br from-sky-100 to-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-sky-200 shadow-lg shadow-sky-900/5 flex flex-col relative overflow-hidden group h-full"
         >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
               <RefreshCw size={80} className="text-sky-600" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-sky-600 mb-3 sm:mb-4 shadow-sm border border-sky-100 relative z-10 shrink-0">
               <Zap size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-lg text-sky-900 uppercase mb-1 sm:mb-2 relative z-10 tracking-tight leading-tight">Chinh phục tri thức</h3>
            <p className="text-[9px] sm:text-[10px] text-black mb-4 sm:mb-6 leading-relaxed font-bold relative z-10 line-clamp-2">Tạo bài tập tùy chỉnh (Trắc nghiệm/Tự luận) từ tài liệu.</p>
            
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-2">
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[9px] sm:text-xs appearance-none"
                >
                   <option value="">Khối...</option>
                   <option value="6">Khối 6</option>
                   <option value="7">Khối 7</option>
                   <option value="8">Khối 8</option>
                   <option value="9">Khối 9</option>
                </select>
                <select 
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[9px] sm:text-xs appearance-none"
                >
                   <option value="Trắc nghiệm">Trắc nghiệm</option>
                   <option value="Tự luận">Tự luận</option>
                   <option value="Trắc nghiệm & Tự luận">Cả hai</option>
                </select>
              </div>

              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Chủ đề ôn tập..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[9px] sm:text-xs"
              />
              
              <input 
                type="number" 
                max={20}
                min={1}
                value={quizCount || ""}
                onChange={(e) => setQuizCount(Math.min(20, parseInt(e.target.value) || 0))}
                placeholder="Số câu (Max 20)"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[9px] sm:text-xs"
              />
            </div>

            <button 
              onClick={startQuiz}
              disabled={!topic.trim() || !grade || !quizCount}
              className="w-full mt-auto bg-sky-600 text-white font-bold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl shadow-lg shadow-sky-200 hover:bg-sky-700 disabled:opacity-50 transition-all text-[9px] sm:text-[10px] uppercase tracking-widest active:scale-95 shrink-0"
            >
              BẮT ĐẦU THỬ THÁCH
            </button>
         </motion.div>

         {/* Option 2: Flashcards */}
         <motion.div 
           whileHover={{ y: -4 }}
           onClick={() => setMode("flashcard")}
           className="bg-gradient-to-br from-orange-100 to-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-orange-200 shadow-lg shadow-orange-900/5 flex flex-col relative overflow-hidden group cursor-pointer h-full"
         >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
               <Layers size={80} className="text-orange-600" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-orange-500 mb-3 sm:mb-4 shadow-sm border border-orange-100 relative z-10 shrink-0">
               <Layers size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-lg text-orange-900 uppercase mb-1 sm:mb-2 relative z-10 tracking-tight leading-tight">Flashcard</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-600 mb-4 sm:mb-6 leading-relaxed font-medium relative z-10 line-clamp-2">Flashcards giúp em ghi nhớ nhanh hơn.</p>
            
            <div className="mt-auto shrink-0">
              <button className="w-full bg-orange-500 text-white font-bold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all text-[9px] sm:text-[10px] uppercase tracking-widest">
                 MỞ THẺ
              </button>
            </div>
         </motion.div>

         {/* Option 3: Mindmap */}
         <motion.div 
           whileHover={{ y: -4 }}
           onClick={() => setMode("mindmap")}
           className="bg-gradient-to-br from-indigo-100 to-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-indigo-200 shadow-lg shadow-indigo-900/5 flex flex-col relative overflow-hidden group cursor-pointer h-full"
         >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
               <Brain size={80} className="text-indigo-600" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-500 mb-3 sm:mb-4 shadow-sm border border-indigo-100 relative z-10 shrink-0">
               <Brain size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-lg text-indigo-900 uppercase mb-1 sm:mb-2 relative z-10 tracking-tight leading-tight">Mindmap</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-600 mb-4 sm:mb-6 leading-relaxed font-medium relative z-10 line-clamp-2">Hệ thống lại kiến thức bằng sơ đồ trực quan.</p>
            
            <div className="mt-auto relative z-10 shrink-0">
              <button className="w-full bg-indigo-600 text-white font-bold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all text-[9px] sm:text-[10px] uppercase tracking-widest">
                 VẼ SƠ ĐỒ
              </button>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
