import { useState } from "react";
import { assessmentService } from "../services/assessment.service";
import { Quiz, Flashcard, MindmapNode, QuizHistory, AssessmentMode, EssayFeedback } from "../types";
import { toast } from "sonner";

export function useAssessment(userId: string) {
  const [mode, setMode] = useState<AssessmentMode>("menu");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6"); // Default grade as string for select component
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Quiz State
  const [quizType, setQuizType] = useState("CHINH_PHUC");
  const [quizCount, setQuizCount] = useState(5);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);

  // Flashcards & Mindmap
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>([]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await assessmentService.getHistory();
      setHistory(res.data || []);
    } catch (e) {
      toast.error("Lỗi khi tải lịch sử học tập.");
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!topic.trim()) {
      toast.error("Vui lòng nhập chủ đề bài học");
      return;
    }
    
    setIsLoading(true);
    setQuizzes([]);
    setErrorMsg("");
    setScore(0);
    setResults([]);
    
    try {
      const response = await assessmentService.generateQuiz({
        grade: Number(grade),
        topic,
        limit: quizCount,
        type: quizType
      });
      
      if (response.status === "success") {
        setQuizzes(response.data.questions || []);
        setMode("quiz");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "❗ Không thể khởi tạo bài tập. Vui lòng thử lại.");
      toast.error("Lỗi khi kết nối với máy chủ AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const createFlashcards = async () => {
    if (!topic.trim() || !grade) return;
    setIsLoading(true);
    try {
      const response = await assessmentService.getFlashcards(Number(grade), topic);
      setFlashcards(response.data.cards || []);
      setActiveId(response.data.id || null);
      setMode("flashcard");
    } catch (error: any) {
      console.error(error);
      toast.error("Không thể tạo bộ thẻ Flashcard.");
    } finally {
      setIsLoading(false);
    }
  };

  const createMindmap = async () => {
    if (!topic.trim() || !grade) return;
    setIsLoading(true);
    try {
      const response = await assessmentService.getMindmap(Number(grade), topic);
      
      // Xử lý dữ liệu mindmap: Có thể ở dạng response.data.nodes (mảng) 
      // hoặc response.data.markdown (chuỗi JSON mảng nodes)
      let nodes: MindmapNode[] = [];
      const data = response.data as any;
      
      if (data.nodes && Array.isArray(data.nodes)) {
        nodes = data.nodes;
      } else if (data.markdown) {
        try {
          // Kiểm tra xem markdown có phải là JSON string không
          const parsed = JSON.parse(data.markdown);
          if (Array.isArray(parsed)) {
            nodes = parsed;
          }
        } catch (e) {
          console.error("Lỗi parse mindmap markdown:", e);
        }
      }

      setMindmapNodes(nodes);
      setActiveId(data.id || null);
      setMode("mindmap");
    } catch (error: any) {
      console.error(error);
      toast.error("Không thể tạo sơ đồ tư duy.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuizHistory = async (finalScore: number, finalResults: boolean[]) => {
    try {
      // Calculate correct count
      const correctCount = finalResults.filter(r => r).length;
      
      const response = await assessmentService.submitQuizResult({
        quizType: "CHINH_PHUC",
        totalQuestions: quizzes.length,
        correctCount
      });

      if (response.status === "success") {
        toast.success(`Chúc mừng! Em nhận được +${response.data.xpEarned} XP!`);
      }
      
      return response.data;
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi khi lưu kết quả bài làm.");
      return null;
    }
  };

  const gradeEssay = async (question: string, answer: string, image?: {data: string, mimeType: string}): Promise<EssayFeedback> => {
     try {
       const response = await assessmentService.evaluateEssay(question, answer, image);
       return response.data;
     } catch (err: any) {
       toast.error("Lỗi khi chấm điểm bài tự luận.");
       throw err;
     }
  };

  return {
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
    gradeEssay,
    fetchHistory
  };
}
