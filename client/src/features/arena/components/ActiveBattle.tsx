import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIcon, Bot, Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import FormattedContent from "@/components/ui/FormattedContent";

interface ActiveBattleProps {
  battleId: string;
  opponent: any;
  questions: any[];
  scores: any;
  isAiMode: boolean;
  totalXP: number;
  socketId: string;
  getSocket: () => any;
  onFinish: (aiResult?: any) => void;
}

export function ActiveBattle({ battleId, opponent, questions, scores, isAiMode, totalXP, socketId, getSocket, onFinish }: ActiveBattleProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [oppScores, setOppScores] = useState<any>(scores);
  const [showExplanation, setShowExplanation] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    setOppScores(scores);
  }, [scores]);

  // AI simulation
  useEffect(() => {
    if (isAnswered) return;
    if (isAiMode && !isAnswered) {
      const aiThinkingTime = Math.random() * 5000 + 4000;
      const timer = setTimeout(() => {
        const correct = Math.random() > 0.35;
        if (correct) {
          const aiPoints = 10 + Math.floor((30 - aiThinkingTime / 1000));
          setOppScores((prev: any) => ({
            ...prev,
            [opponent.id]: (prev[opponent.id] || 0) + Math.max(0, aiPoints)
          }));
        }
      }, aiThinkingTime);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, isAnswered]);

  // Timer
  useEffect(() => {
    if (isAnswered || showExplanation || showHint) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (questions[currentIdx].options) handleAnswer(-1);
          else submitEssay();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIdx, isAnswered, showExplanation, showHint]);

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    const current = questions[currentIdx];
    const correct = idx === current.answerIndex;

    if (!correct && attempts === 0 && isAiMode) {
      setAttempts(1);
      setShowHint(true);
      return;
    }

    setSelectedIdx(idx);
    setIsAnswered(true);
    setResults(prev => [...prev, correct]);

    if (isAiMode) {
      let points = correct ? (10 + timeLeft) : 0;
      if (correct && attempts === 1) points += 30;
      if (correct && current.difficulty === "Vận dụng") points += 20;

      setOppScores((prev: any) => ({
        ...prev,
        [socketId]: (prev[socketId] || 0) + points
      }));

      setTimeout(() => { setShowExplanation(true); }, 800);
    } else {
      const socket = getSocket();
      socket?.emit("submit-battle-answer", { battleId, questionIdx: currentIdx, correct, timeLeft });
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          nextQuestion();
        } else {
          onFinish();
        }
      }, 1500);
    }
  };

  const submitEssay = async () => {
    if (isAnswered) return;
    setIsGrading(true);
    setIsAnswered(true);

    const isHonest = essayAnswer.length > 10;
    const correct = isHonest && essayAnswer.length > 20;
    const points = correct ? (20 + timeLeft) : 0;

    setOppScores((prev: any) => ({
      ...prev,
      [socketId]: (prev[socketId] || 0) + points
    }));

    setIsGrading(false);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    setShowHint(false);
    setIsAnswered(false);
    setSelectedIdx(null);
    setEssayAnswer("");
    setTimeLeft(30);
    setAttempts(0);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onFinish({ scores: oppScores, results });
    }
  };

  const current = questions[currentIdx];
  const isMultipleChoice = current.options && current.options.length > 0;
  const myScore = oppScores[socketId] || 0;
  const oppScore = oppScores[opponent.id] || 0;

  return (
    <div className="max-w-5xl mx-auto pb-6 h-full overflow-y-auto no-scrollbar px-3">
       <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-sky-50 shadow-lg relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-20 bg-slate-100 rounded-full" />
          
          <div className="flex items-center gap-3 sm:gap-4 w-1/3">
             <div className="w-10 h-10 sm:w-14 sm:h-14 bg-sky-600 rounded-xl flex items-center justify-center text-white font-bold border border-sky-100 shadow-sm relative shrink-0">
                <UserIcon size={20} className="sm:w-8 sm:h-8" />
             </div>
             <div className="min-w-0">
                <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Của em</p>
                <div className="flex items-baseline gap-1">
                   <p className="text-xl sm:text-2xl font-bold text-sky-900 leading-tight">{myScore}</p>
                   <span className="text-[7px] sm:text-[9px] font-bold text-sky-500 uppercase">EXP</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center gap-1 w-1/3 shrink-0">
             <div className="relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                   <circle cx="32" cy="32" r="28" fill="transparent" stroke="#F1F5F9" strokeWidth="4" />
                   <circle cx="32" cy="32" r="28" fill="transparent" stroke="#14B8A6" strokeWidth="4" strokeDasharray={175.8} strokeDashoffset={175.8 * (1 - timeLeft / 30)} className="transition-all duration-1000" />
                </svg>
                {/* Fallback for smaller SVG viewBox if needed, using 32 as center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className={cn("text-xl sm:text-2xl font-bold leading-tight", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-sky-900")}>{timeLeft}</span>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-end gap-3 w-1/3 text-right">
             <div className="min-w-0">
                <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                  {isAiMode ? "AI" : "Đối thủ"}
                </p>
                <div className="flex items-center justify-end gap-1.5">
                   <p className="text-base sm:text-xl font-bold text-slate-900 truncate max-w-[60px] sm:max-w-none leading-tight">
                     {isAiMode ? oppScore : (opponent.displayName || opponent.username)}
                   </p>
                </div>
                {!isAiMode && (
                   <div className="flex items-baseline justify-end gap-0.5 leading-tight mt-0.5">
                      <p className="text-base sm:text-lg font-bold text-sky-600">{oppScore}</p>
                      <span className="text-[7px] font-bold text-sky-400 uppercase">PTS</span>
                   </div>
                )}
             </div>
             <div className={cn(
               "w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold border shadow-sm shrink-0",
               isAiMode ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
             )}>
                {isAiMode ? <Bot size={20} className="sm:w-8 sm:h-8" /> : <UserIcon size={20} className="sm:w-8 sm:h-8" />}
             </div>
          </div>
       </div>

       <motion.div 
         key={currentIdx}
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         className="bg-white rounded-[2rem] p-6 sm:p-10 border border-sky-50 shadow-xl relative"
       >
          <div className="flex items-center justify-between mb-6 sm:mb-10">
             <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-sky-600 text-white rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                   Câu {currentIdx + 1} / {questions.length}
                </div>
                <div className="px-2 py-1.5 bg-slate-50 text-slate-400 rounded-lg font-bold text-[8px] sm:text-[9px] uppercase tracking-widest border border-slate-100">
                   {current.difficulty || "Cơ bản"}
                </div>
             </div>
             {isAnswered && isMultipleChoice && (
               <div className={cn("px-3 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-tight", 
                 selectedIdx === current.answerIndex ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                 {selectedIdx === current.answerIndex ? "Đúng" : "Sai"}
               </div>
             )}
          </div>

          <h3 className="text-lg sm:text-2xl font-bold text-sky-900 mb-8 sm:mb-12 leading-snug uppercase tracking-tight">
             <FormattedContent content={current.question} isInline />
          </h3>
          
          {isMultipleChoice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               {current.options.map((opt: string, i: number) => {
                 const isCorrect = i === current.answerIndex;
                 const isSelected = selectedIdx === i;
                 
                 return (
                    <button 
                      key={i} 
                      onClick={() => handleAnswer(i)}
                      disabled={isAnswered || showHint}
                      className={cn(
                        "group p-5 sm:p-8 rounded-2xl border-2 sm:border-4 text-left transition-all relative overflow-hidden",
                        !isAnswered && !showHint
                          ? "bg-white border-slate-100 hover:border-sky-500 hover:bg-sky-50/10" 
                          : isCorrect && isAnswered
                            ? "bg-emerald-50 border-emerald-500"
                            : isSelected 
                              ? "bg-red-50 border-red-500"
                              : "bg-slate-50 border-transparent opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                         <span className={cn(
                           "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold border shadow-sm shrink-0 text-xs sm:text-sm",
                           !isAnswered 
                            ? "bg-white border-slate-200 text-slate-400 group-hover:bg-sky-600 group-hover:text-white"
                            : isCorrect ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                         )}>
                            {String.fromCharCode(65 + i)}
                         </span>
                         <span className={cn("text-sm sm:text-lg font-bold leading-tight", isAnswered && isCorrect ? "text-emerald-900" : "text-slate-800")}>{opt}</span>
                      </div>
                    </button>
                 );
               })}
            </div>
          ) : (
            <div className="space-y-4">
               <textarea 
                 value={essayAnswer}
                 onChange={(e) => setEssayAnswer(e.target.value)}
                 disabled={isAnswered}
                 placeholder="Nhập câu trả lời..."
                 className="w-full h-32 sm:h-48 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 sm:p-8 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium text-sm sm:text-lg leading-relaxed disabled:opacity-50"
               />
               {!isAnswered && (
                 <button 
                   onClick={submitEssay}
                   disabled={!essayAnswer.trim()}
                   className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-widest text-[10px] sm:text-xs"
                 >
                    {isGrading ? <Loader2 className="animate-spin" size={18} /> : "Gửi câu trả lời"}
                 </button>
               )}
            </div>
          )}

          <AnimatePresence>
             {showHint && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="mt-6 p-6 sm:p-8 bg-orange-50 rounded-2xl border-2 border-orange-100 relative overflow-hidden"
               >
                  <div className="flex flex-col gap-4">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <AlertCircle className="text-orange-600" size={16} />
                           <p className="text-[8px] sm:text-[9px] font-bold text-orange-800 uppercase tracking-widest">Gợi ý thông minh</p>
                        </div>
                        <p className="text-[11px] sm:text-sm text-orange-900 font-medium italic">"{current.hint || "Hãy xem lại câu hỏi."}"</p>
                     </div>
                     <button 
                       onClick={() => setShowHint(false)}
                       className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all uppercase tracking-widest text-[9px] sm:text-[10px]"
                     >
                       Thử lại ngay
                     </button>
                  </div>
               </motion.div>
             )}

             {showExplanation && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-6 p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-100"
               >
                  <div className="flex flex-col gap-4">
                     <div className="flex-1">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Giải thích từ AI:</p>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium italic leading-relaxed">{current.explanation}</p>
                     </div>
                     <button 
                       onClick={nextQuestion}
                       className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold shadow-md hover:bg-sky-700 transition-all uppercase tracking-widest text-[9px] sm:text-[10px]"
                     >
                       {currentIdx < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                     </button>
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
       </motion.div>
    </div>
  );
}
