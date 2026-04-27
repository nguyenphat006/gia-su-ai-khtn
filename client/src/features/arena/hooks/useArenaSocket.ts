import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ArenaStatus, ConfigRole, BattleConfig } from "../types";

export function useArenaSocket(studentName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [status, setStatus] = useState<ArenaStatus>("lobby");
  const [battleData, setBattleData] = useState<any>(null);
  const [scores, setScores] = useState<any>({});
  const [battleResult, setBattleResult] = useState<any>(null);
  const [configRole, setConfigRole] = useState<ConfigRole>("waiting");
  const [battleConfig, setBattleConfig] = useState<BattleConfig>({ grade: "", topic: "", type: "Trắc nghiệm", count: 5 });
  const [incomingChallenge, setIncomingChallenge] = useState<any>(null);
  const [challengeRejects, setChallengeRejects] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState("");

  // Callbacks set by arena logic
  const onMatchFoundRef = useRef<(data: any) => void>(() => {});
  const onBattleFinishRef = useRef<(data: any) => void>(() => {});

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-lobby", studentName);
    });

    socket.on("players-update", (data) => setPlayers(data));
    
    socket.on("match-found", async (data) => {
      onMatchFoundRef.current(data);
    });

    socket.on("battle-update", (data) => {
      setScores(data.scores);
    });

    socket.on("battle-finished", (data) => {
      onBattleFinishRef.current(data);
    });

    // Challenge flow handlers
    socket.on("challenge-received", (data) => {
      setIncomingChallenge(data.challenger);
      setStatus("challenge-received");
    });

    socket.on("challenge-error", (data) => {
      alert(data.message);
      setStatus("lobby");
    });

    socket.on("challenge-sent", (data) => {
      setBattleData({ opponent: data.target });
      setStatus("matching");
    });

    socket.on("challenge-accepted", (data) => {
      setBattleData({ opponent: data.opponent });
      setConfigRole("proposer");
      setStatus("challenge-config");
      setBattleConfig(prev => ({ ...prev, topic: "" }));
    });

    socket.on("challenge-rejected", () => {
      alert("Chiến binh đã từ chối lời mời.");
      setStatus("lobby");
      setBattleData(null);
    });

    socket.on("challenge-config-received", (data) => {
      setBattleConfig(data.config);
      setConfigRole("reviewer");
      setStatus("challenge-config");
    });

    socket.on("config-rejected", () => {
      setChallengeRejects(prev => {
        const next = prev + 1;
        if (next >= 5) {
          alert("Thách đấu không thành công. Lời đề xuất thứ 5 đã bị từ chối.");
          socket.emit("cancel-challenge-flow", { targetId: battleData?.opponent?.id });
          setStatus("lobby");
          return 0;
        } else {
          alert(`Đối thủ đang đề xuất chủ đề khác (${next}/5).`);
          setConfigRole("waiting");
          return next;
        }
      });
    });

    socket.on("challenge-flow-cancelled", () => {
      alert("Thách đấu không thành công.");
      setStatus("lobby");
      setBattleData(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [studentName]);

  const getSocket = () => socketRef.current;
  const getSocketId = () => socketRef.current?.id || "";

  const findMatch = () => {
    setStatus("matching");
    socketRef.current?.emit("find-match");
  };

  const cancelMatch = () => {
    setStatus("lobby");
    if (battleData?.target) {
      socketRef.current?.emit("cancel-challenge-flow", { targetId: battleData.target.id });
    } else {
      socketRef.current?.emit("cancel-match");
    }
  };

  const sendChallenge = () => {
    if (!challengeTarget.trim()) return;
    socketRef.current?.emit("send-challenge", { targetUsername: challengeTarget });
  };

  return {
    socket: socketRef,
    getSocket,
    getSocketId,
    players,
    status, setStatus,
    battleData, setBattleData,
    scores, setScores,
    battleResult, setBattleResult,
    configRole, setConfigRole,
    battleConfig, setBattleConfig,
    incomingChallenge, setIncomingChallenge,
    challengeRejects, setChallengeRejects,
    challengeTarget, setChallengeTarget,
    onMatchFoundRef,
    onBattleFinishRef,
    findMatch,
    cancelMatch,
    sendChallenge,
  };
}
