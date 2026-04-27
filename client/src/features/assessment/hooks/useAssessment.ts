import { useState, useEffect } from "react";
import { db, handleFirestoreError } from "@/lib/firebase";
import { collection, query, limit, getDocs, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { generateQuiz, generateFlashcards, generateMindmap, analyzePerformance, evaluateEssay } from "@/lib/gemini";
import { Quiz, Flashcard, MindmapNode, QuizHistory, AssessmentMode, EssayFeedback } from "../types";

export function useAssessment(userId: string) {
  const [mode, setMode] = useState<AssessmentMode>("menu");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [context, setContext] = useState("");
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Quiz State
  const [quizType, setQuizType] = useState("Trắc nghiệm");
  const [quizCount, setQuizCount] = useState(5);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);

  // Flashcards & Mindmap
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [mindmapNodes, setMindmapNodes] = useState<MindmapNode[]>([]);

  // Fetch Knowledge Base Context
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const kbSnap = await getDocs(query(collection(db, "knowledge_base"), limit(30)));
        const docsText = kbSnap.docs.map((d: any) => d.data().content).join("\n\n");
        setContext(docsText);
      } catch (err) {
        handleFirestoreError(err, 'list', 'knowledge_base');
      }
    };
    fetchContext();
  }, []);

  // Fetch User History
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "quizzes"),
      where("studentId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const historyList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizHistory[];
      setHistory(historyList);
    });

    return () => unsubscribe();
  }, [userId]);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuizzes([]);
    setErrorMsg("");
    setScore(0);
    setResults([]);
    setMode("quiz");
    
    try {
      const result = await generateQuiz(topic, context, grade, quizType, quizCount);
      if (result.error) {
        setErrorMsg(result.error);
        setMode("menu");
      } else {
        setQuizzes(result.quizzes || []);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("❗ Không thể khởi tạo bài tập. Vui lòng thử lại.");
      setMode("menu");
    } finally {
      setIsLoading(false);
    }
  };

  const createFlashcards = async () => {
    if (!topic.trim() || !grade) return;
    setIsLoading(true);
    try {
      const result = await generateFlashcards(topic, context, grade);
      setFlashcards(result.flashcards || []);
      setMode("flashcard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMindmap = async () => {
    if (!topic.trim() || !grade) return;
    setIsLoading(true);
    try {
      const result = await generateMindmap(topic, context, grade);
      setMindmapNodes(result.mindmap || []);
      setMode("mindmap");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuizHistory = async (finalScore: number, finalResults: boolean[]) => {
    try {
      const report = await analyzePerformance(topic, finalResults.map((res, i) => ({
        question: quizzes[i].question,
        correct: res
      })), "Tài liệu học tập");

      await addDoc(collection(db, "quizzes"), {
        studentId: userId,
        topic,
        score: finalScore,
        total: quizzes.length,
        performance: report,
        createdAt: serverTimestamp()
      });

      return report;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const gradeEssay = async (question: string, answer: string, image?: {data: string, mimeType: string}): Promise<EssayFeedback> => {
     return evaluateEssay(question, answer, image);
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
    startQuiz,
    createFlashcards,
    createMindmap,
    saveQuizHistory,
    gradeEssay
  };
}
