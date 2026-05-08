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
    <div className="max-w-6xl mx-auto flex flex-col justify-start py-4 sm:py-10 px-3 sm:px-6">
      <div className="text-center mb-6 sm:mb-12">
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 sm:mb-3 uppercase">Rèn luyện kiến thức</h2>
        <p className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Chọn phương thức học tập phù hợp với em</p>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center text-sm font-bold"
        >
          {errorMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pb-10">
         {/* Option 1: AI Quiz */}
         <motion.div 
           whileHover={{ y: -8 }}
           className="bg-gradient-to-br from-sky-100 to-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-sky-200 shadow-xl shadow-sky-900/10 flex flex-col relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
               <RefreshCw size={120} className="text-sky-600" />
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-sky-600 mb-4 sm:mb-6 shadow-sm border border-sky-100 relative z-10">
               <Zap size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="font-display font-black text-base sm:text-xl text-sky-900 uppercase mb-2 sm:mb-3 relative z-10 tracking-tight leading-none">Chinh phục tri thức</h3>
            <p className="text-[10px] sm:text-[11px] text-black mb-6 sm:mb-8 leading-relaxed font-bold relative z-10">Tạo bài tập tùy chỉnh (Trắc nghiệm/Tự luận) từ tài liệu của cô Trang.</p>
            
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <select 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[10px] sm:text-xs appearance-none"
                >
                   <option value="">Khối lớp...</option>
                   <option value="6">Khối 6</option>
                   <option value="7">Khối 7</option>
                   <option value="8">Khối 8</option>
                   <option value="9">Khối 9</option>
                </select>
                <select 
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[10px] sm:text-xs appearance-none"
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
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2 sm:py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[10px] sm:text-xs"
              />
              
              <input 
                type="number" 
                max={20}
                min={1}
                value={quizCount || ""}
                onChange={(e) => setQuizCount(Math.min(20, parseInt(e.target.value) || 0))}
                placeholder="Số câu (Max 20)"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2 sm:py-3 outline-none focus:border-sky-500 transition-all font-bold text-sky-900 text-[10px] sm:text-xs"
              />
            </div>

            <button 
              onClick={startQuiz}
              disabled={!topic.trim() || !grade || !quizCount}
              className="w-full mt-auto bg-sky-600 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-700 disabled:opacity-50 transition-all text-[10px] sm:text-xs uppercase tracking-widest active:scale-95"
            >
              BẮT ĐẦU THỬ THÁCH
            </button>
         </motion.div>

         {/* Option 2: Flashcards */}
         <motion.div 
           whileHover={{ y: -8 }}
           onClick={() => setMode("flashcard")}
           className="bg-gradient-to-br from-orange-100 to-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-orange-200 shadow-xl shadow-orange-900/10 flex flex-col relative overflow-hidden group cursor-pointer"
         >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
               <Layers size={120} className="text-orange-600" />
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-orange-500 mb-4 sm:mb-6 shadow-sm border border-orange-100 relative z-10">
               <Layers size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="font-display font-black text-base sm:text-xl text-orange-900 uppercase mb-2 sm:mb-3 relative z-10 tracking-tight leading-none">Flashcard</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-600 mb-6 sm:mb-8 leading-relaxed font-medium relative z-10">Flashcards thông minh giúp em ghi nhớ các thuật ngữ KHTN nhanh hơn.</p>
            
            <div className="mt-auto">
              <button className="w-full bg-orange-500 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all text-[10px] sm:text-xs uppercase tracking-widest">
                 MỞ THẺ
              </button>
            </div>
         </motion.div>

         {/* Option 3: Mindmap */}
         <motion.div 
           whileHover={{ y: -8 }}
           onClick={() => setMode("mindmap")}
           className="bg-gradient-to-br from-indigo-100 to-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-indigo-200 shadow-xl shadow-indigo-900/10 flex flex-col relative overflow-hidden group cursor-pointer"
         >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
               <Brain size={120} className="text-indigo-600" />
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-500 mb-4 sm:mb-6 shadow-sm border border-indigo-100 relative z-10">
               <Brain size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className="font-display font-black text-base sm:text-xl text-indigo-900 uppercase mb-2 sm:mb-3 relative z-10 tracking-tight leading-none">Mindmap</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-600 mb-6 sm:mb-8 leading-relaxed font-medium relative z-10">Hệ thống lại kiến thức bằng sơ đồ trực quan, dễ hiểu và bao quát.</p>
            
            <div className="mt-auto relative z-10">
              <button className="w-full bg-indigo-600 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all text-[10px] sm:text-xs uppercase tracking-widest">
                 VẼ SƠ ĐỒ
              </button>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
