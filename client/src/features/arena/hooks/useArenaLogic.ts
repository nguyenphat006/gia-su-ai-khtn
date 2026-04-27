import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, where } from "firebase/firestore";
import { generateQuiz, analyzePerformance } from "@/lib/gemini";
import confetti from "canvas-confetti";
import { BattleConfig, UserStats } from "../types";

export function useArenaLogic(studentName: string, addXP: (xp: number) => void) {
  const [isAiMode, setIsAiMode] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ wins: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "arena_results"), orderBy("score", "desc"), limit(10));
      const snap = await getDocs(q);
      setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      const userQ = query(collection(db, "arena_results"), where("username", "==", studentName));
      const userSnap = await getDocs(userQ);
      const wins = userSnap.docs.filter(d => d.data().winner).length;
      setUserStats({ wins, total: userSnap.size });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [studentName]);

  const generateBattleQuestions = async (config: BattleConfig) => {
    const knowledgeRef = collection(db, "knowledge_base");
    const snap = await getDocs(query(knowledgeRef, limit(20)));
    const chunks = snap.docs.map(d => d.data().content as string);

    let context = chunks.join("\n\n");
    if (config.topic) {
      const keywords = config.topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      context = chunks
        .map(content => {
          let score = 0;
          const lowContent = content.toLowerCase();
          keywords.forEach(word => { if (lowContent.includes(word)) score++; });
          return { content, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.content)
        .join("\n\n---\n\n");
    }

    const quizData = await generateQuiz(
      config.topic || "KHTN THCS (Vật lý, Hóa học, Sinh học)",
      context,
      config.grade || "8",
      config.type || "Trắc nghiệm",
      config.count || 10
    );

    if (quizData.error) throw new Error(quizData.error);
    return quizData.quizzes || [];
  };

  const handleBattleFinish = async (
    result: any,
    socketId: string,
    battleData: any,
    battleConfig: BattleConfig,
    isAi: boolean
  ) => {
    setLoadingReport(true);

    const myScore = result.scores[socketId];
    const oppId = Object.keys(result.scores).find(id => id !== socketId);
    const oppScore = oppId ? result.scores[oppId] : 0;
    const winner = myScore >= oppScore;

    if (isAi) {
      try {
        const report = await analyzePerformance(battleConfig.topic, result.results.map((res: boolean, i: number) => ({
          question: questions[i].question,
          correct: res
        })), "Tài liệu học tập về " + battleConfig.topic);
        setPerformanceReport(report);
      } catch (e) {
        console.error("AI Analysis Error:", e);
      }
    }

    let xpEarned = isAi ? 50 : 20;
    if (winner) xpEarned += isAi ? 50 : 30;
    if (streak >= 10) xpEarned += 100;

    addXP(xpEarned);
    if (winner) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    try {
      await addDoc(collection(db, "arena_results"), {
        username: studentName,
        score: myScore,
        winner,
        opponent: battleData.opponent.username,
        xpEarned,
        createdAt: serverTimestamp(),
        mode: isAi ? "AI" : "PvP"
      });
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }

    return { myScore, oppScore, winner };
  };

  return {
    isAiMode, setIsAiMode,
    questions, setQuestions,
    performanceReport, setPerformanceReport,
    loadingReport,
    streak,
    leaderboard,
    userStats,
    errorMsg, setErrorMsg,
    generateBattleQuestions,
    handleBattleFinish,
    fetchLeaderboard,
  };
}
