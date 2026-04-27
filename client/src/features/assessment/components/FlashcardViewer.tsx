import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Layers, Sparkles, Zap, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { processLaTeX } from "@/lib/utils";
import { Flashcard, AssessmentMode } from "../types";

function FlashcardItem({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="w-full h-full cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        animate={{ 
          rotateY: flipped ? 180 : 0,
          z: flipped ? 50 : 0
        }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.02, rotateX: 2, rotateY: flipped ? 178 : 2 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-full relative preserve-3d"
      >
        {/* Front */}
        <div 
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-white to-orange-50 border-4 border-orange-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-xl group-hover:border-orange-300 transition-all duration-500"
        >
           <div className="absolute top-4 right-4 opacity-10">
              <Sparkles size={40} className="text-orange-400" />
           </div>
           <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-6">MẶT TRƯỚC</p>
           <div className="text-2xl font-display font-black text-orange-900 leading-tight">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{processLaTeX(card.front)}</ReactMarkdown>
           </div>
           <div className="mt-12 group-hover:scale-110 transition-transform">
              <div className="bg-orange-100/50 px-4 py-2 rounded-full text-orange-600 font-bold italic text-[10px]">Chạm để xem đáp án...</div>
           </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-orange-600 to-orange-500 border-4 border-orange-400 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl text-white shadow-orange-200/20"
          style={{ transform: "rotateY(180deg)" }}
        >
           <div className="absolute top-4 left-4 opacity-20">
              <Zap size={40} className="text-white" />
           </div>
           <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-6">MẶT SAU</p>
           <div className="text-xl font-bold leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{processLaTeX(card.back)}</ReactMarkdown>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  setFlashcards: (cards: Flashcard[]) => void;
  topic: string;
  setTopic: (t: string) => void;
  grade: string;
  setGrade: (g: string) => void;
  setMode: (m: AssessmentMode) => void;
  createFlashcards: () => void;
}

export function FlashcardViewer({
  flashcards, setFlashcards, topic, setTopic, grade, setGrade, setMode, createFlashcards
}: FlashcardViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIdx(prev => prev + newDirection);
  };

  return (
    <div className="flex flex-col h-full bg-orange-50/10 rounded-[2.5rem] p-8 border border-orange-100/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setMode("menu"); setFlashcards([]); }}
            className="p-2 hover:bg-white rounded-xl text-orange-600 transition-all border border-orange-100 bg-white/50"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-display font-black text-orange-900 text-xl tracking-tight uppercase">Học qua Flashcards</h3>
        </div>
        {flashcards.length > 0 && (
           <button 
             onClick={() => { setFlashcards([]); setCurrentIdx(0); }}
             className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
           >
             Đổi chủ đề
           </button>
        )}
      </div>

      {flashcards.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
          <div className="text-center space-y-2 mb-4">
             <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto shadow-sm">
                <Layers size={32} />
             </div>
             <p className="text-orange-700 font-bold">Hãy nhập thông tin để AI tạo bộ thẻ cho em</p>
          </div>
          
          <div className="space-y-4">
             <select 
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-white border-2 border-orange-100 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold text-orange-900"
             >
                <option value="">Chọn khối lớp...</option>
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
             </select>
             <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Nhập bài học/chủ đề..."
                className="w-full bg-white border-2 border-orange-100 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold text-orange-900"
             />
             <button 
                onClick={createFlashcards}
                disabled={!topic.trim() || !grade}
                className="w-full bg-orange-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all disabled:opacity-50"
             >
                TẠO FLASHCARDS
             </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
           <div className="relative w-full max-w-sm h-80 perspective-1000 group">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIdx}
                  custom={direction}
                  variants={{
                    enter: (direction: number) => ({
                      x: direction > 0 ? 50 : -50,
                      opacity: 0,
                      scale: 0.9
                    }),
                    center: {
                      zIndex: 1,
                      x: 0,
                      opacity: 1,
                      scale: 1
                    },
                    exit: (direction: number) => ({
                      zIndex: 0,
                      x: direction < 0 ? 50 : -50,
                      opacity: 0,
                      scale: 0.9
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-full h-full relative"
                >
                  <FlashcardItem card={flashcards[currentIdx]} />
                </motion.div>
              </AnimatePresence>
           </div>

           <div className="flex items-center gap-8">
              <button 
                disabled={currentIdx === 0}
                onClick={() => paginate(-1)}
                className="p-4 bg-white rounded-2xl shadow-md border border-orange-100 text-orange-600 disabled:opacity-30 hover:bg-orange-50 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="text-center">
                 <p className="text-2xl font-black text-orange-900">{currentIdx + 1} <span className="text-orange-300 mx-1">/</span> {flashcards.length}</p>
                 <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-1">SỐ THẺ</p>
              </div>
              <button 
                disabled={currentIdx === flashcards.length - 1}
                onClick={() => paginate(1)}
                className="p-4 bg-white rounded-2xl shadow-md border border-orange-100 text-orange-600 disabled:opacity-30 hover:bg-orange-50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
