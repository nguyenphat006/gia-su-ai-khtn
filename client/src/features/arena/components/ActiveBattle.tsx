import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIcon, Bot, Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="max-w-5xl mx-auto pb-20">
       <div className="flex items-center justify-between mb-8 bg-white p-8 rounded-[2rem] border border-sky-50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-32 bg-slate-100 rounded-full" />
          
          <div className="flex items-center gap-6 w-1/3">
             <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center text-white font-black border-2 border-sky-100 shadow-sm relative">
                <UserIcon size={32} />
                <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white px-2 py-0.5 rounded-full text-[8px] font-black shadow-sm">
                   LV.{Math.floor(totalXP / 500) + 1}
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Của em</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-display font-black text-sky-900">{myScore}</p>
                   <span className="text-[10px] font-bold text-sky-500">EXP</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-1/3">
             <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                   <circle cx="48" cy="48" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="6" />
                   <circle cx="48" cy="48" r="40" fill="transparent" stroke="#14B8A6" strokeWidth="6" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - timeLeft / 30)} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className={cn("text-3xl font-display font-black leading-none", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-sky-900")}>{timeLeft}</span>
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Giây</span>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-end gap-6 w-1/3 text-right">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đối thủ AI</p>
                <p className="text-3xl font-display font-black text-slate-900">{oppScore}</p>
             </div>
             <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 font-black border-2 border-orange-100 shadow-sm">
                <Bot size={32} />
             </div>
          </div>
       </div>

       <motion.div 
         key={currentIdx}
         initial={{ opacity: 0, x: 50 }}
         animate={{ opacity: 1, x: 0 }}
         className="bg-white rounded-[3rem] p-12 border border-sky-50 shadow-2xl relative"
       >
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                   Câu {currentIdx + 1} / {questions.length}
                </div>
                <div className="px-3 py-2 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest">
                   Độ khó: {current.difficulty || "Biết"}
                </div>
             </div>
             {isAnswered && isMultipleChoice && (
               <div className={cn("px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-md", 
                 selectedIdx === current.answerIndex ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                 {selectedIdx === current.answerIndex ? "Chính xác" : "Chưa đúng"}
               </div>
             )}
          </div>

          <h3 className="text-2xl md:text-3xl font-display font-black text-sky-900 mb-12 leading-snug">{current.question}</h3>
          
          {isMultipleChoice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {current.options.map((opt: string, i: number) => {
                 const isCorrect = i === current.answerIndex;
                 const isSelected = selectedIdx === i;
                 
                 return (
                    <button 
                      key={i} 
                      onClick={() => handleAnswer(i)}
                      disabled={isAnswered || showHint}
                      className={cn(
                        "group p-8 rounded-[2rem] border-4 text-left transition-all relative overflow-hidden",
                        !isAnswered && !showHint
                          ? "bg-white border-slate-50 hover:border-sky-500 hover:shadow-2xl hover:-translate-y-1" 
                          : isCorrect && isAnswered
                            ? "bg-emerald-50 border-emerald-500 shadow-inner"
                            : isSelected 
                              ? "bg-red-50 border-red-500"
                              : "bg-slate-50 border-transparent opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-6 relative z-10">
                         <span className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center font-display font-black border-2 shadow-sm shrink-0",
                           !isAnswered 
                            ? "bg-white border-slate-200 text-slate-400 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-400"
                            : isCorrect ? "bg-emerald-600 text-white border-emerald-400" : "bg-red-600 text-white border-red-400"
                         )}>
                            {String.fromCharCode(65 + i)}
                         </span>
                         <span className={cn("text-lg font-bold", isAnswered && isCorrect ? "text-emerald-900" : "text-slate-800")}>{opt}</span>
                      </div>
                    </button>
                 );
               })}
            </div>
          ) : (
            <div className="space-y-6">
               <textarea 
                 value={essayAnswer}
                 onChange={(e) => setEssayAnswer(e.target.value)}
                 disabled={isAnswered}
                 placeholder="Nhập câu trả lời của em tại đây (AI có khả năng phát hiện copy-paste)..."
                 className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 outline-none focus:border-sky-500 focus:bg-white transition-all font-medium text-lg leading-relaxed disabled:opacity-50"
               />
               {!isAnswered && (
                 <button 
                   onClick={submitEssay}
                   disabled={!essayAnswer.trim()}
                   className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-200/50 flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-widest text-xs"
                 >
                    {isGrading ? <Loader2 className="animate-spin" /> : "Gửi câu trả lời"}
                 </button>
               )}
            </div>
          )}

          <AnimatePresence>
             {showHint && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="mt-12 p-8 bg-orange-50 rounded-[2rem] border-2 border-orange-200 relative overflow-hidden"
               >
                  <Sparkles className="absolute top-2 right-2 text-orange-500 opacity-20" size={40} />
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                           <AlertCircle className="text-orange-600" size={20} />
                           <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Quy tắc Gợi ý thông minh:</p>
                        </div>
                        <p className="text-sm text-orange-900 font-bold leading-relaxed mb-1">Ồ, suy nghĩ lại một chút nhé! Đây là manh mối cho em:</p>
                        <p className="text-base text-orange-900 font-black italic">"{current.hint || "Hãy xem lại dữ kiện trong câu hỏi."}"</p>
                        <p className="text-[9px] text-orange-600 font-black uppercase mt-4">Em còn 1 cơ hội nữa - Tự sửa đúng sẽ được +30 EXP!</p>
                     </div>
                     <button 
                       onClick={() => setShowHint(false)}
                       className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all uppercase tracking-widest text-[10px] whitespace-nowrap"
                     >
                       Thử lại lần 2
                     </button>
                  </div>
               </motion.div>
             )}

             {showExplanation && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-12 p-8 bg-slate-50 rounded-[2rem] border border-slate-100"
               >
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gia sư AI chấm điểm & giải thích:</p>
                        <div className="prose prose-slate prose-sm max-w-none">
                           <p className="text-slate-600 font-medium italic leading-relaxed">{current.explanation}</p>
                        </div>
                     </div>
                     <div className="flex flex-col gap-3 justify-end">
                        <button 
                          onClick={nextQuestion}
                          className="px-8 py-4 bg-sky-600 text-white rounded-2xl font-black shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all uppercase tracking-widest text-[10px] whitespace-nowrap"
                        >
                          {currentIdx < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                        </button>
                     </div>
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
       </motion.div>
    </div>
  );
}
