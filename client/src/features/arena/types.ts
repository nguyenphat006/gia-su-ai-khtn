export type ArenaStatus = "lobby" | "matching" | "battle" | "result" | "ai-config" | "challenge-received" | "challenge-config";
export type ArenaView = "main" | "leaderboard";
export type ConfigRole = "proposer" | "reviewer" | "waiting";

export interface BattleConfig {
  grade: string;
  topic: string;
  type: string;
  count: number;
}

export interface UserStats {
  wins: number;
  total: number;
}
