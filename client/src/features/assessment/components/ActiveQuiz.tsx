import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, HelpCircle, CheckCircle2, XCircle, ChevronRight, AlertCircle, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quiz, EssayFeedback } from "../types";
import FormattedContent from "@/components/ui/FormattedContent";

interface ActiveQuizProps {
  topic: string;
  quizzes: Quiz[];
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  results: boolean[];
  setResults: React.Dispatch<React.SetStateAction<boolean[]>>;
  addXP: (xp: number) => void;
  onFinish: () => void;
  gradeEssay: (question: string, answer: string, image?: {data: string, mimeType: string}) => Promise<EssayFeedback>;
}

export function ActiveQuiz({
  topic, quizzes, score, setScore, results, setResults, addXP, onFinish, gradeEssay
}: ActiveQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState("");
  const [essayImage, setEssayImage] = useState<{data: string, mimeType: string} | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [essayFeedback, setEssayFeedback] = useState<EssayFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const current = quizzes[currentIdx];
  
  // Robust MCQ detection: MUST have at least 2 non-empty options
  const isMultipleChoice = React.useMemo(() => {
    if (!current?.options || !Array.isArray(current.options)) return false;
    return current.options.filter(opt => opt && opt.trim().length > 0).length >= 2;
  }, [current]);

  // Fallback for content field (support both content and question)
  const questionContent = current?.content || (current as any)?.question || "";

  // Resolve answer index from string if missing
  const actualAnswerIndex = React.useMemo(() => {
    if (current?.answerIndex !== undefined && current.answerIndex !== null) return current.answerIndex;
    if (current?.correctAnswer && current.options) {
      return current.options.findIndex(opt => opt === current.correctAnswer);
    }
    return -1;
  }, [current]);

  useEffect(() => {
    if (!isAnswered && quizzes.length > 0 && current) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(45);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, isAnswered, quizzes.length]);

  const handleTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setResults(prev => [...prev, false]);
    setSelectedIdx(-1);
  };

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedIdx(idx);
    
    if (idx === actualAnswerIndex) {
      setIsAnswered(true);
      setScore(prev => prev + 1);
      setResults(prev => [...prev, true]);
      const baseXP = current.difficulty === "Khó" ? 20 : (current.difficulty === "Trung bình" ? 15 : 10);
      const bonusXP = (attempts === 1 && !showHint) ? 0 : (attempts === 1 ? 5 : 0);
      addXP(baseXP + bonusXP);
    } else {
      if (attempts === 0) {
        setAttempts(1);
        setShowHint(true);
        setHintUsed(true);
      } else {
        setIsAnswered(true);
        setResults(prev => [...prev, false]);
      }
    }
  };

  const submitEssay = async () => {
    if (isAnswered || (!essayAnswer.trim() && !essayImage)) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGrading(true);
    
    try {
      const evaluation = await gradeEssay(questionContent, essayAnswer, essayImage || undefined);
      setEssayFeedback(evaluation);
      
      if (evaluation.isPassing) {
         setIsAnswered(true);
         setScore(prev => prev + 1);
         setResults(prev => [...prev, true]);
         addXP(20);
      } else {
         if (attempts === 0) {
           setAttempts(1);
           setShowHint(true);
           setHintUsed(true);
         } else {
           setIsAnswered(true);
           setResults(prev => [...prev, false]);
         }
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi chấm bài. Em thử lại nhé!");
    }
    
    setIsGrading(false);
  };

  const nextQuestion = async () => {
    if (currentIdx < quizzes.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setEssayAnswer("");
      setEssayImage(null);
      setEssayFeedback(null);
      setAttempts(0);
      setShowHint(false);
    } else {
      onFinish();
    }
  };

  if (!current || quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-6 h-full">
         <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner">
            <HelpCircle size={40} className="opacity-20" />
         </div>
         <div className="text-center">
            <p className="text-lg font-bold text-slate-600 uppercase tracking-tight">Không tìm thấy câu hỏi</p>
            <p className="text-sm font-medium">Cô Trang chưa chuẩn bị kịp nội dung cho phần này.</p>
         </div>
         <button 
           onClick={() => onFinish()}
           className="px-8 py-3 bg-sky-600 text-white rounded-xl font-bold shadow-lg hover:bg-sky-700 transition-all uppercase tracking-widest text-[10px]"
         >
           Quay lại Menu
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col custom-scrollbar px-3 sm:px-0">
      <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-50 shadow-sm shrink-0">
         <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
               {currentIdx + 1}
            </div>
            <div>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-tight mb-1 focus:outline-none">Tiến trình em học</p>
               <p className="text-sm font-bold text-sky-900 leading-tight">{currentIdx + 1} / {quizzes.length}</p>
            </div>
         </div>
         <div className="text-right flex items-center gap-4 sm:gap-6">
            <div className={cn(
              "flex flex-col items-end transition-colors",
              timeLeft <= 10 ? "text-red-500" : "text-sky-600"
            )}>
               <p className="text-[8px] font-bold uppercase tracking-[0.2em] leading-tight mb-1 opacity-40">Thời gian</p>
               <div className="flex items-center gap-1.5">
                  <Clock size={14} className={timeLeft <= 10 ? "animate-pulse" : ""} />
                  <p className="text-sm font-bold leading-tight">{timeLeft}s</p>
               </div>
            </div>
            <div>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Thưởng</p>
               <p className="text-sm font-bold text-orange-600 leading-tight">+{score * 10} EXP</p>
            </div>
         </div>
      </div>

      {!isAnswered && (
        <div className="w-full h-1 bg-slate-100 rounded-full mb-4 sm:mb-6 overflow-hidden shadow-inner shrink-0">
           <motion.div 
             initial={{ width: "100%" }}
             animate={{ width: `${(timeLeft / 45) * 100}%` }}
             className={cn(
               "h-full transition-colors duration-1000",
               timeLeft <= 10 ? "bg-red-500" : "bg-sky-500"
             )}
           />
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-sky-50 shadow-sm relative overflow-hidden"
        >
           <div className="text-lg sm:text-xl font-bold text-sky-900 mb-6 sm:mb-10 leading-snug tracking-tight">
             <FormattedContent content={questionContent} />
           </div>
           
           <AnimatePresence>
              {showHint && !isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl relative overflow-hidden"
                >
                   <div className="flex flex-col gap-3">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="text-orange-600" size={14} />
                            <p className="text-[8px] font-bold text-orange-800 uppercase tracking-widest leading-tight">Gợi ý thông minh</p>
                         </div>
                         <p className="text-xs text-orange-900 font-bold leading-relaxed italic">"{current.hint || "Hãy xem lại câu hỏi kỹ hơn nhé!"}"</p>
                      </div>
                      <button 
                        onClick={() => setShowHint(false)}
                        className="w-full py-2 bg-orange-500 text-white rounded-lg font-bold shadow-md uppercase tracking-widest text-[8px]"
                      >
                        Thử lại ngay
                      </button>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>

           {isMultipleChoice ? (
             <div className="space-y-3 sm:space-y-4">
                {current.options!.map((option, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    whileHover={!isAnswered ? { scale: 1.01, x: 2 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                    className={cn(
                      "w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center gap-4 sm:gap-6 border-2 transition-all text-left font-bold text-xs sm:text-sm relative group",
                      selectedIdx === idx 
                        ? (idx === actualAnswerIndex 
                            ? "bg-sky-50 border-sky-500 text-sky-700 shadow-md ring-4 ring-sky-50/50" 
                            : "bg-red-50 border-red-500 text-red-700 shadow-md ring-4 ring-red-50/50")
                        : (isAnswered && idx === actualAnswerIndex 
                            ? "bg-sky-50 border-sky-500 text-sky-700 animate-pulse" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-sky-200 hover:bg-sky-50/10")
                    )}
                    disabled={isAnswered}
                  >
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm border shadow-sm transition-all duration-300",
                      selectedIdx === idx 
                        ? (idx === actualAnswerIndex ? "bg-sky-500 text-white border-sky-400 rotate-[360deg]" : "bg-red-500 text-white border-red-400")
                        : (isAnswered && idx === actualAnswerIndex ? "bg-sky-500 text-white border-sky-400" : "bg-white text-sky-600 border-sky-100 shadow-inner")
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <FormattedContent content={option} isInline className="flex-1 leading-relaxed" />
                  </motion.button>
                ))}
             </div>
           ) : (
             <div className="space-y-4">
                <div className="relative">
                  <textarea 
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    disabled={isAnswered}
                    placeholder="Nhập câu trả lời của em tại đây..."
                    className="w-full h-32 sm:h-40 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 sm:p-6 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium text-sm sm:text-base leading-relaxed disabled:opacity-50"
                  />
                  
                  {essayImage && (
                    <div className="absolute bottom-4 left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-md border-2 border-white">
                      <img src={`data:${essayImage.mimeType};base64,${essayImage.data}`} className="w-full h-full object-cover" />
                      {!isAnswered && (
                        <button 
                          onClick={() => setEssayImage(null)} 
                          className="absolute top-1 right-1 bg-white rounded-full text-red-500 shadow-sm hover:scale-110 transition-transform"
                        >
                          <XCircle size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {!isAnswered && (
                    <button 
                      onClick={() => imageInputRef.current?.click()}
                      className="absolute bottom-4 right-4 p-2.5 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-colors shadow-sm cursor-pointer"
                    >
                      <ImageIcon size={18} />
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64String = (reader.result as string).split(',')[1];
                          setEssayImage({ data: base64String, mimeType: file.type });
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
                {!isAnswered && (
                  <button 
                    onClick={submitEssay}
                    disabled={(!essayAnswer.trim() && !essayImage) || isGrading}
                    className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200/50 flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest text-[9px] sm:text-[10px]"
                  >
                     {isGrading ? <Loader2 className="animate-spin" size={18} /> : "Gửi câu trả lời"}
                  </button>
                )}
             </div>
           )}

           <AnimatePresence>
             {isAnswered && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 className="mt-8 overflow-hidden"
               >
                  <div className="p-5 sm:p-8 bg-sky-50/50 rounded-2xl sm:rounded-[2rem] border border-sky-100 relative shadow-inner">
                    <div className="flex items-center gap-2 mb-3 text-sky-800 font-bold uppercase tracking-[0.2em] text-[8px] sm:text-[9px]">
                       <div className="w-5 h-5 bg-sky-200 rounded-full flex items-center justify-center">
                         <HelpCircle size={12} className="text-sky-700" />
                       </div>
                       Gia sư AI chấm điểm
                    </div>
                    <div className="prose prose-slate prose-xs sm:prose-sm max-w-none markdown-body">
                      {essayFeedback ? (
                        <>
                          <div className="text-sky-900 leading-relaxed font-semibold italic opacity-90 text-xs sm:text-sm">
                            <FormattedContent content={essayFeedback.feedback} />
                          </div>
                          <div className={cn("mt-3 inline-block px-3 py-1 rounded-full font-bold text-[9px] sm:text-[10px]", essayFeedback.isPassing ? "bg-sky-100 text-sky-700" : "bg-red-100 text-red-700")}>
                            {essayFeedback.isPassing ? `Đạt Yêu Cầu (${essayFeedback.score}/10)` : `Cần Cố Gắng Hơn (${essayFeedback.score}/10)`}
                          </div>
                        </>
                      ) : (
                        <div className="text-sky-900 leading-relaxed font-semibold italic opacity-90 text-xs sm:text-sm">
                            <FormattedContent content={current.explanation} />
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={nextQuestion}
                      className="w-full mt-6 bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest text-[9px] sm:text-[10px]"
                    >
                      {currentIdx < quizzes.length - 1 ? "Tiếp tục thử thách" : "Hoàn thành & Nhận EXP"}
                      <ChevronRight size={16} />
                    </button>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
