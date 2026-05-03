import { useState, useEffect, useCallback } from "react";
import { useArenaSocket } from "./hooks/useArenaSocket";
import { useArenaLogic } from "./hooks/useArenaLogic";
import { ArenaView } from "./types";
import { useAuth } from "@/hooks/useAuth";

import { ArenaLobby } from "./components/ArenaLobby";
import { AiMatchConfig } from "./components/AiMatchConfig";
import { PvPMatchConfig } from "./components/PvPMatchConfig";
import { MatchingScreen } from "./components/MatchingScreen";
import { ActiveBattle } from "./components/ActiveBattle";
import { BattleResult } from "./components/BattleResult";

interface ArenaFeatureProps {
  studentName: string;
  addXP: (xp: number) => void;
  totalXP: number;
}

export default function ArenaFeature({ studentName, addXP, totalXP }: ArenaFeatureProps) {
  const { user } = useAuth();
  const grade = user?.studentProfile?.grade?.toString() || user?.class?.grade?.toString() || "8";
  const studentCode = user?.studentProfile?.studentCode || "";
  
  const sock = useArenaSocket(studentName, grade, studentCode);
  const logic = useArenaLogic(studentName, addXP);
  const [view, setView] = useState<ArenaView>("main");

  // Wire socket callbacks to logic
  useEffect(() => {
    sock.onMatchFoundRef.current = async (data: any) => {
      console.log("[Arena] Match found event received:", data.battleId);
      logic.setIsAiMode(false);
      sock.setBattleData(data);
      try {
        sock.setStatus("matching");
        const quizzes = await logic.generateBattleQuestions({
          grade: data.config?.grade || grade,
          topic: data.config?.topic || "KHTN THCS",
          type: data.config?.type || "Trắc nghiệm",
          count: data.config?.count || 10,
        });
        
        if (!quizzes || quizzes.length === 0) {
            throw new Error("Không thể tải câu hỏi cho trận đấu này.");
        }

        console.log("[Arena] PvP questions loaded:", quizzes.length);
        logic.setQuestions(quizzes);
        sock.setScores({ [sock.getSocketId()]: 0, [data.opponent.id]: 0 });
        
        // Use a small delay to ensure React has processed state updates
        setTimeout(() => {
            sock.setStatus("battle");
        }, 100);
      } catch (err: any) {
        console.error("[Arena] Match start error:", err);
        alert(err.message || "Lỗi khi tạo trận đấu. Vui lòng thử lại.");
        sock.getSocket()?.emit("cancel-challenge-flow", { targetId: data.opponent?.id });
        sock.setStatus("lobby");
      }
    };

    sock.onBattleFinishRef.current = async (data: any) => {
      sock.setBattleResult(data);
      sock.setStatus("result");
      await logic.handleBattleFinish(data, sock.getSocketId(), sock.battleData, sock.battleConfig, logic.isAiMode);
    };
  }, [sock.battleData, sock.battleConfig, logic.isAiMode, grade]);

  const startAiMatch = () => {
    logic.setIsAiMode(true);
    sock.setStatus("ai-config");
  };

  const confirmAiBattle = useCallback(async () => {
    if (!sock.battleConfig.topic.trim() || !sock.battleConfig.grade) return;

    const aiOpponent = { id: "ai-tutor", username: "Gia sư AI (Thử thách)", isAi: true };
    sock.setStatus("matching");
    logic.setErrorMsg("");
    sock.setBattleData({ battleId: `ai-${Date.now()}`, opponent: aiOpponent });

    try {
      console.log("[Arena] Generating AI questions for topic:", sock.battleConfig.topic);
      const quizzes = await logic.generateBattleQuestions(sock.battleConfig);
      
      if (!quizzes || quizzes.length === 0) {
        throw new Error("AI không thể tạo câu hỏi cho chủ đề này.");
      }

      console.log("[Arena] AI questions generated successfully:", quizzes.length);
      logic.setQuestions(quizzes);
      sock.setScores({ [sock.getSocketId()]: 0, [aiOpponent.id]: 0 });
      
      // Chuyển sang màn hình battle
      setTimeout(() => {
        sock.setStatus("battle");
      }, 100);
    } catch (err: any) {
      console.error("[Arena] AI Battle Error:", err);
      logic.setErrorMsg(err.message || "❗ Không thể khởi tạo trận đấu. Vui lòng thử lại.");
      sock.setStatus("ai-config");
    }
  }, [sock.battleConfig, sock.getSocketId, logic.generateBattleQuestions]);

  const handleBattleFinishFromUI = async (aiResult?: any) => {
    if (logic.isAiMode && aiResult) {
      sock.setBattleResult(aiResult);
      sock.setStatus("result");
      await logic.handleBattleFinish(aiResult, sock.getSocketId(), sock.battleData, sock.battleConfig, true);
    } else {
      sock.getSocket()?.emit("finish-battle", { battleId: sock.battleData.battleId });
    }
  };

  const backToLobby = () => {
    sock.setStatus("lobby");
    sock.setBattleResult(null);
    logic.setPerformanceReport(null);
    logic.setQuestions([]);
  };

  // Render based on status
  if (sock.status === "ai-config") {
    return <AiMatchConfig battleConfig={sock.battleConfig} setBattleConfig={sock.setBattleConfig} errorMsg={logic.errorMsg} onCancel={() => sock.setStatus("lobby")} onConfirm={confirmAiBattle} />;
  }

  if (sock.status === "challenge-config") {
    return <PvPMatchConfig configRole={sock.configRole} battleConfig={sock.battleConfig} setBattleConfig={sock.setBattleConfig} battleData={sock.battleData} challengeRejects={sock.challengeRejects} setChallengeRejects={sock.setChallengeRejects} setConfigRole={sock.setConfigRole} setStatus={sock.setStatus} getSocket={() => sock.getSocket()} />;
  }

  if (sock.status === "matching") {
    return <MatchingScreen isAiMode={logic.isAiMode} battleData={sock.battleData} errorMsg={logic.errorMsg} onCancel={sock.cancelMatch} onRetry={() => sock.setStatus("ai-config")} />;
  }

  if (sock.status === "battle" && logic.questions.length > 0) {
    return <ActiveBattle battleId={sock.battleData.battleId} opponent={sock.battleData.opponent} questions={logic.questions} scores={sock.scores} isAiMode={logic.isAiMode} totalXP={totalXP} socketId={sock.getSocketId()} getSocket={() => sock.getSocket()} onFinish={handleBattleFinishFromUI} />;
  }

  if (sock.status === "result" && sock.battleResult) {
    return <BattleResult battleResult={sock.battleResult} battleData={sock.battleData} socketId={sock.getSocketId()} studentName={studentName} totalXP={totalXP} isAiMode={logic.isAiMode} battleConfig={sock.battleConfig} loadingReport={logic.loadingReport} performanceReport={logic.performanceReport} onBackToLobby={backToLobby} />;
  }

  return <ArenaLobby studentName={studentName} totalXP={totalXP} players={sock.players} leaderboard={logic.leaderboard} userStats={logic.userStats} view={view} setView={setView} challengeTarget={sock.challengeTarget} setChallengeTarget={sock.setChallengeTarget} incomingChallenge={sock.incomingChallenge} setIncomingChallenge={sock.setIncomingChallenge} sendChallenge={sock.sendChallenge} startAiMatch={startAiMatch} getSocket={() => sock.getSocket()} setBattleData={sock.setBattleData} setStatus={sock.setStatus} grade={grade} findMatch={sock.findMatch} isMatching={sock.isMatching} />;
}
