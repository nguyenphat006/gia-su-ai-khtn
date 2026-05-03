import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ArenaStatus, ConfigRole, BattleConfig } from "../types";

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://giasu-ai-khtn-api.onrender.com";

export function useArenaSocket(studentName: string, grade: string = "", studentCode: string = "") {
  const socketRef = useRef<Socket | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [status, setStatus] = useState<ArenaStatus>("lobby");
  const [isMatching, setIsMatching] = useState(false);
  const [battleData, setBattleData] = useState<any>(null);
  const [scores, setScores] = useState<any>({});
  const [battleResult, setBattleResult] = useState<any>(null);
  const [configRole, setConfigRole] = useState<ConfigRole>("waiting");
  const [battleConfig, setBattleConfig] = useState<BattleConfig>({ grade: grade, topic: "", type: "Trắc nghiệm", count: 5 });
  const [incomingChallenge, setIncomingChallenge] = useState<any>(null);
  const [challengeRejects, setChallengeRejects] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState("");

  // Callbacks set by arena logic
  const onMatchFoundRef = useRef<(data: any) => void>(() => {});
  const onBattleFinishRef = useRef<(data: any) => void>(() => {});

  useEffect(() => {
    // Nếu grade thay đổi, cập nhật config
    if (grade) {
        setBattleConfig(prev => ({ ...prev, grade }));
    }
  }, [grade]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ArenaSocket] Connected to server.");
      socket.emit("join-lobby", { username: studentName, grade, studentCode });
    });

    socket.on("players-update", (data) => setPlayers(data));
    
    socket.on("match-found", async (data) => {
      setIsMatching(false);
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
      setIsMatching(false);
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
      setIsMatching(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [studentName, grade, studentCode]);

  const getSocket = () => socketRef.current;
  const getSocketId = () => socketRef.current?.id || "";

  const findMatch = (sameGrade: boolean = true) => {
    setIsMatching(true);
    setStatus("matching");
    socketRef.current?.emit("find-match", { sameGrade });
  };

  const cancelMatch = () => {
    setIsMatching(false);
    setStatus("lobby");
    if (battleData?.target) {
      socketRef.current?.emit("cancel-challenge-flow", { targetId: battleData.target.id });
    } else {
      socketRef.current?.emit("cancel-match");
    }
  };

  const sendChallenge = () => {
    if (!challengeTarget.trim()) return;
    
    // Kiểm tra nếu là mã HS (chứa số) hoặc username
    const isCode = /^\d+$/.test(challengeTarget.trim()) || (challengeTarget.length >= 5 && challengeTarget.toUpperCase().startsWith("HS"));
    
    socketRef.current?.emit("send-challenge", { 
        targetUsername: isCode ? undefined : challengeTarget,
        targetStudentCode: isCode ? challengeTarget.toUpperCase() : undefined
    });
  };

  return {
    socket: socketRef,
    getSocket,
    getSocketId,
    players,
    status, setStatus,
    isMatching, setIsMatching,
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
