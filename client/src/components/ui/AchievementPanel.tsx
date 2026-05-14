import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Target, 
  Flame, 
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import GamificationFeature from "@/features/gamification/GamificationFeature";
import { apiClient } from "@/lib/apiClient";

interface AchievementPanelProps {
  studentData: any;
  currentUserId: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AchievementPanel = memo(({
  studentData,
  currentUserId,
  isOpen,
  onToggle
}: AchievementPanelProps) => {
  const [sidebarTab, setSidebarTab] = useState<"ranking" | "stats">("stats");
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);

  useEffect(() => {
    if (sidebarTab === "ranking" && isOpen) {
      fetchLeaderboard();
    }
  }, [sidebarTab, isOpen]);

  async function fetchLeaderboard() {
    setIsLoadingRanking(true);
    try {
      const data = await apiClient<any[]>('/api/gamification/leaderboard');
      setWeeklyLeaderboard(data);
    } catch (error) {
      console.error("Lỗi khi tải bảng xếp hạng:", error);
    } finally {
      setIsLoadingRanking(false);
    }
  }

  return (
    <>
      {/* ── Toggle Button (Floating Tab) ─────────────────────── */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-[60] group flex items-center transition-all duration-500 ease-in-out",
          isOpen ? "right-80" : "right-0"
        )}
      >
        <div className={cn(
            "w-8 h-24 bg-white border border-slate-200 border-r-0 rounded-l-2xl shadow-[-10px_0_20px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors",
            isOpen && "shadow-none border-slate-100"
        )}>
            <div className="relative">
                <Trophy size={16} className={cn("transition-colors", isOpen ? "text-sky-600" : "text-slate-400 group-hover:text-sky-500")} />
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </div>
            <div className="flex flex-col gap-0.5">
                {[1, 2, 3].map(i => (
                    <div key={i} className={cn("w-1 h-1 rounded-full", isOpen ? "bg-sky-200" : "bg-slate-300")} />
                ))}
            </div>
            {isOpen ? <ChevronRight size={14} className="text-slate-300" /> : <ChevronLeft size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* ── Panel Content ────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-100 p-4 space-y-4 z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* ── XP Card ───────────────────────────────────────────── */}
            <div className="p-4 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden shrink-0 shadow-lg shadow-slate-200">
              <div className="absolute -right-2 -top-2 w-20 h-20 bg-sky-500/10 blur-2xl"></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng kinh nghiệm</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black">{(studentData?.xp || 0).toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest">EXP</span>
                  </div>
                </div>
                {studentData?.streak > 1 && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                    <Flame size={12} className="text-orange-400 fill-orange-400" />
                    <span className="text-[10px] font-bold text-white">{studentData.streak} ngày</span>
                  </div>
                )}
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2 p-0.5 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((studentData?.xp || 0) / (getRank(studentData?.xp || 0).max || 1000)) * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                />
              </div>
              <div className="flex justify-between items-center relative z-10">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  {studentData?.level || getRank(studentData?.xp || 0).name}
                </p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none italic">
                    Level Up: {Math.max(0, (getRank(studentData?.xp || 0).max || 0) - (studentData?.xp || 0)).toLocaleString()} XP
                </p>
              </div>
            </div>

            {/* ── Tabbed Ranking & Stats ────────────────────────────── */}
            <div className="flex-1 bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col min-h-0 shadow-inner">
              <div className="flex items-center p-1.5 bg-white m-2 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                <button
                  onClick={() => setSidebarTab("stats")}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                    sidebarTab === "stats"
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Target size={14} /> Nhiệm vụ
                </button>
                <button
                  onClick={() => setSidebarTab("ranking")}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                    sidebarTab === "ranking"
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Trophy size={14} /> Xếp hạng
                </button>
              </div>

              <div className="px-3 pb-3 flex-1 overflow-hidden min-h-0">
                <AnimatePresence mode="wait">
                  {sidebarTab === "stats" ? (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="h-full overflow-y-auto custom-scrollbar pt-1"
                    >
                      <GamificationFeature studentData={studentData} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ranking"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="h-full flex flex-col pt-1"
                    >
                      {isLoadingRanking ? (
                        <div className="space-y-3 p-2 animate-pulse">
                          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-white rounded-2xl border border-slate-100" />)}
                        </div>
                      ) : (
                        <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">Bảng vinh danh tuần này</p>
                          {weeklyLeaderboard.map((player, i) => {
                            const isActive = player.userId === currentUserId;
                            const displayName = player.displayName || "Học sinh";

                            return (
                              <div
                                key={player.userId}
                                className={cn(
                                  "flex items-center justify-between p-2.5 rounded-[1.25rem] transition-all border",
                                  isActive
                                    ? "bg-sky-50 border-sky-200 shadow-md shadow-sky-100"
                                    : "bg-white border-slate-100 hover:border-sky-100 hover:shadow-sm"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-4 text-[10px] font-black text-center",
                                    i === 0 ? "text-yellow-500 scale-125" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-400" : "text-slate-300"
                                  )}>
                                    {i + 1}
                                  </div>
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden shrink-0">
                                    {player.avatarUrl ? (
                                      <img src={player.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      displayName[0]?.toUpperCase() || "?"
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={cn(
                                      "text-[11px] font-bold leading-tight truncate uppercase tracking-tight",
                                      isActive ? "text-sky-900" : "text-slate-700"
                                    )}>
                                      {displayName}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={cn(
                                    "text-[10px] font-black leading-tight",
                                    isActive ? "text-sky-600" : "text-slate-500"
                                  )}>
                                    {player.weeklyXp.toLocaleString()}
                                  </p>
                                  <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">EXP</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
});

export default AchievementPanel;
