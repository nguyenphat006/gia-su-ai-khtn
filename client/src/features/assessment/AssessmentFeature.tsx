import { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ChatFeature from "@/features/chat/ChatFeature";

import { useAssessment } from "./hooks/useAssessment";
import { AssessmentMenu } from "./components/AssessmentMenu";
import { ActiveQuiz } from "./components/ActiveQuiz";
import { QuizResult } from "./components/QuizResult";
import { FlashcardViewer } from "./components/FlashcardViewer";
import { MindmapViewer } from "./components/MindmapViewer";
import { HistoryViewer } from "./components/HistoryViewer";

interface AssessmentFeatureProps {
  studentName: string;
  addXP: (xp: number) => void;
  userId: string;
}

export default function AssessmentFeature({ studentName, addXP, userId }: AssessmentFeatureProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = searchParams.get("mode") as any;
  const urlTopic = searchParams.get("topic");
  const urlId = searchParams.get("id");

  const {
    mode, setMode,
    topic, setTopic,
    grade, setGrade,
    quizType, setQuizType,
    quizCount, setQuizCount,
    history,
    isLoading,
    errorMsg,
    quizzes,
    flashcards, setFlashcards,
    mindmapNodes, setMindmapNodes,
    score, setScore,
    results, setResults,
    activeId,
    startQuiz,
    createFlashcards,
    createMindmap,
    saveQuizHistory,
    gradeEssay
  } = useAssessment(userId);

  const [isFinished, setIsFinished] = useState(false);

  // Sync state from URL on mount
  useEffect(() => {
    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    }
    if (urlTopic && urlTopic !== topic) {
      setTopic(urlTopic);
    }
    // We don't necessarily need to sync id back to hook yet unless we add fetchById logic
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const params: any = { mode };
    if (topic) params.topic = topic;
    if (activeId) params.id = activeId;
    setSearchParams(params, { replace: true });
  }, [mode, topic, activeId]);

  // Wrap startQuiz to reset isFinished
  const handleStartQuiz = () => {
    setIsFinished(false);
    startQuiz();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sky-600 gap-4 h-full">
        <Loader2 className="animate-spin" size={48} />
        <p className="font-bold text-lg font-display uppercase tracking-widest animate-pulse">Cô đang soạn bộ câu hỏi cho em...</p>
      </div>
    );
  }

  if (mode === "chat") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => setMode("menu")}
            className="p-2 hover:bg-sky-50 rounded-xl text-sky-600 transition-all border border-sky-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-display font-black text-sky-900 tracking-tight">Trợ lý học tập thông minh</h3>
        </div>
        <ChatFeature studentName={studentName} addXP={addXP} userId={userId} />
      </div>
    );
  }

  if (mode === "history") {
    return <HistoryViewer history={history} setMode={setMode} />;
  }

  if (mode === "flashcard") {
    return (
      <FlashcardViewer 
        flashcards={flashcards} setFlashcards={setFlashcards}
        topic={topic} setTopic={setTopic}
        grade={grade} setGrade={setGrade}
        setMode={setMode} createFlashcards={createFlashcards}
      />
    );
  }

  if (mode === "mindmap") {
    return (
      <MindmapViewer 
        mindmapNodes={mindmapNodes} setMindmapNodes={setMindmapNodes}
        topic={topic} setTopic={setTopic}
        grade={grade} setGrade={setGrade}
        setMode={setMode} createMindmap={createMindmap}
      />
    );
  }

  if (mode === "quiz") {
    if (isFinished) {
      return (
        <QuizResult 
          topic={topic} score={score} totalQuizzes={quizzes.length}
          results={results} startQuiz={handleStartQuiz}
          setMode={setMode} saveQuizHistory={saveQuizHistory}
        />
      );
    }
    
    return (
      <ActiveQuiz 
        topic={topic} quizzes={quizzes}
        score={score} setScore={setScore}
        results={results} setResults={setResults}
        addXP={addXP} onFinish={() => setIsFinished(true)}
        gradeEssay={gradeEssay}
      />
    );
  }

  // mode === "menu"
  return (
    <AssessmentMenu 
      errorMsg={errorMsg}
      grade={grade} setGrade={setGrade}
      quizType={quizType} setQuizType={setQuizType}
      topic={topic} setTopic={setTopic}
      quizCount={quizCount} setQuizCount={setQuizCount}
      startQuiz={handleStartQuiz} setMode={setMode}
    />
  );
}
