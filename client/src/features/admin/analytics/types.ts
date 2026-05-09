export interface UsageStat {
  date: string;
  count: number;
}

export interface ActivityTimeStat {
  hour: number;
  count: number;
  dayOfWeek?: number; // 0-6
}

export interface RankDistribution {
  rank: string;
  count: number;
  minXp: number;
  maxXp: number;
  color?: string;
}

export interface TopStudent {
  userId: string;
  displayName: string;
  username: string;
  xp: number;
  rank: string;
  streak: number;
  totalXp?: number;
}

export interface UserEngagement {
  rankDistribution: RankDistribution[];
  streakStats: {
    averageStreak: number;
    maxStreak: number;
    topSteakUsers: any[];
  };
}

export interface ChatLog {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  createdAt: string;
  answeredAt: string;
  session: {
    id: string;
    title: string;
    user: {
      id: string;
      displayName: string;
      username: string;
      studentProfile: any;
      class: any;
    };
  };
}

export interface ArenaPlayerInfo {
  id: string | null;
  displayName: string;
  username: string | null;
  studentCode: string | null;
  score: number | null;
  winner: boolean;
  xpEarned: number;
}

export interface ArenaLog {
  id: string;
  mode: "PVP" | "AI";
  topic: string;
  createdAt: string;
  player1: ArenaPlayerInfo;
  player2: ArenaPlayerInfo;
}

export interface ArenaLogDetail extends ArenaLog {
  // Thêm các thông tin chi tiết nếu cần
}
