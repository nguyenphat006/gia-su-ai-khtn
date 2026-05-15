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
  students?: any[];
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
  topStreaks?: any[];
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

export interface ActivityLog {
  id: string;
  userId: string | null;
  username: string | null;
  userRole: string | null;
  source: "student" | "admin" | "guest";
  method: string;
  path: string;
  module: string;
  action: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
  queryParams?: any;
  requestBody?: any;
  createdAt: string;
  user?: {
    displayName: string;
    username: string;
    role: string;
    studentProfile?: { avatarUrl: string | null; studentCode: string; grade: number };
    teacherProfile?: { avatarUrl: string | null; employeeCode: string | null; subject: string | null };
  };
}

export interface ActivityLogSummary {
  stats: {
    totalToday: number;
    error4xxToday: number;
    error5xxToday: number;
    slowRequestsToday: number;
    totalAllTime: number;
    error4xxAllTime: number;
    error5xxAllTime: number;
    slowRequestsAllTime: number;
  };
  topModules: { module: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
}
