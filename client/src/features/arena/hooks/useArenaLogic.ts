import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { BattleConfig, UserStats } from "../types";
import { getStoredAccessToken } from "@/lib/auth";
import { analyzePerformance } from "@/lib/gemini"; // Chỉ giữ lại phân tích hiệu suất cục bộ/client nếu chưa code server

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
      const token = getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Gọi API lấy Leaderboard
      const resLeaderboard = await fetch("/api/arena/leaderboard?limit=10", { headers });
      if (resLeaderboard.ok) {
        const data = await resLeaderboard.json();
        setLeaderboard(data.data.leaderboard || []);
      }

      // Gọi API lấy My Stats
      const resStats = await fetch("/api/arena/my-stats", { headers });
      if (resStats.ok) {
        const data = await resStats.json();
        setUserStats({ wins: data.data.stats.wins, total: data.data.stats.totalMatches });
      }
    } catch (e) {
      console.error("Lỗi khi tải bảng xếp hạng:", e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [studentName]);

  const generateBattleQuestions = async (config: BattleConfig) => {
    try {
      const token = getAccessToken();
      const res = await fetch("/api/arena/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          grade: config.grade || "8",
          topic: config.topic || "KHTN THCS (Vật lý, Hóa học, Sinh học)",
          type: config.type || "Trắc nghiệm",
          count: config.count || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || "Lỗi tạo câu hỏi");
      }
      return data.data.quizzes || [];
    } catch (err: any) {
      throw new Error(err.message || "Lỗi kết nối máy chủ");
    }
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

    // AI phân tích điểm yếu (tạm thời vẫn dùng client function nếu muốn, hoặc bạn có thể chuyển lên server)
    if (isAi) {
      try {
        const report = await analyzePerformance(
          battleConfig.topic,
          result.results.map((res: boolean, i: number) => ({
            question: questions[i]?.question || "Câu hỏi",
            correct: res,
          })),
          "Tài liệu học tập về " + battleConfig.topic
        );
        setPerformanceReport(report);
      } catch (e) {
        console.error("AI Analysis Error:", e);
      }
    }

    if (winner) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    try {
      const token = getAccessToken();
      const res = await fetch("/api/arena/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          score: myScore,
          mode: isAi ? "AI" : "PVP",
          winner,
          opponent: battleData.opponent.username || "Đối thủ",
          topic: battleConfig.topic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Server đã cộng XP, ta gọi hàm addXP để cập nhật UI cục bộ
        if (data.data?.result?.xpEarned) {
          addXP(data.data.result.xpEarned);
        }
      }
      fetchLeaderboard();
    } catch (err) {
      console.error("Lỗi khi lưu kết quả:", err);
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
