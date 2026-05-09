import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Target, 
  Flame, 
  MessageSquare, 
  BookOpen, 
  Swords, 
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import GamificationFeature from "@/features/gamification/GamificationFeature";
import { SCHOOL_LOGO_URL } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";

interface SidebarProps {
  studentData: any;
  leaderboard: any[];
  currentUserId: string;
  onLogout: () => void;
}

export default function Sidebar({
  studentData,
  leaderboard,
  currentUserId,
  onLogout
}: SidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<"ranking" | "stats">("stats");
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  useEffect(() => {
    if (sidebarTab === "ranking") {
      fetchLeaderboard();
    }
  }, [sidebarTab]);

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

  const navItems = [
    { path: "/chat", label: "Trợ lý AI", icon: MessageSquare, color: "text-sky-500", bg: "bg-sky-50" },
    { path: "/quiz", label: "Ôn tập", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
    { path: "/arena", label: "Đấu trường", icon: Swords, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 h-[100dvh] bg-white border-r border-slate-100 p-4 space-y-2 shrink-0 relative z-50 overflow-hidden">
      {/* ── Branding ────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center px-2 shrink-0">
        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-50 rounded-[2rem] border border-slate-100 p-4 mb-2 shadow-sm flex items-center justify-center">
          <img src={SCHOOL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight uppercase">
          Gia sư AI <span className="text-sky-500">KHTN</span>
        </h1>
        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em]">THCS Phước Tân 3</p>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex flex-col gap-0.5 shrink-0">
        {navItems.map((item) => {
          const isActive = activePath === item.path || (item.path === "/chat" && activePath === "/");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "group w-full flex items-center justify-between p-2 rounded-xl transition-all duration-300",
                isActive 
                  ? `${item.bg} ${item.color} shadow-sm border border-white/50` 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isActive ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-white"
                )}>
                  <item.icon size={16} />
                </div>
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={12} className="opacity-40" />}
            </button>
          );
        })}
      </nav>

      {/* ── XP Card ───────────────────────────────────────────── */}
      <div className="p-3 bg-slate-900 rounded-2xl text-white relative overflow-hidden shrink-0">
        <div className="absolute -right-2 -top-2 w-10 h-10 bg-sky-500/10 blur-xl"></div>
        <div className="flex justify-between items-start mb-1.5">
          <div>
            <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Thành tích</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{(studentData?.xp || 0).toLocaleString()}</span>
              <span className="text-[6px] font-bold text-sky-400 uppercase">EXP</span>
            </div>
          </div>
          {studentData?.streak > 1 && (
            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10">
              <Flame size={8} className="text-orange-400 fill-orange-400" />
              <span className="text-[7px] font-bold text-white">{studentData.streak}</span>
            </div>
          )}
        </div>
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-1">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((studentData?.xp || 0) / (getRank(studentData?.xp || 0).max || 1000)) * 100, 100)}%` }}
            className="h-full bg-sky-400" 
          />
        </div>
        <p className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter">
          {studentData?.level || getRank(studentData?.xp || 0).name}
        </p>
      </div>

      {/* ── Tabbed Ranking & Stats ────────────────────────────── */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col min-h-0 shadow-sm">
        <div className="flex items-center p-1 bg-slate-50/50 m-1 rounded-lg border border-slate-100/50 shrink-0">
          <button
            onClick={() => setSidebarTab("stats")}
            className={cn(
              "flex-1 py-1 text-[7px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1",
              sidebarTab === "stats"
                ? "bg-white text-sky-600 shadow-sm border border-slate-200/50"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Target size={10} /> Nhiệm vụ
          </button>
          <button
            onClick={() => setSidebarTab("ranking")}
            className={cn(
              "flex-1 py-1 text-[7px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1",
              sidebarTab === "ranking"
                ? "bg-white text-sky-600 shadow-sm border border-slate-200/50"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Trophy size={10} /> Xếp hạng
          </button>
        </div>

        <div className="px-2 pb-2 flex-1 overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {sidebarTab === "stats" ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="h-full overflow-y-auto custom-scrollbar pt-1"
              >
                <GamificationFeature studentData={studentData} />
              </motion.div>
            ) : (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="h-full flex flex-col pt-1"
              >
                {isLoadingRanking ? (
                  <div className="space-y-1.5 p-1 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-slate-100 rounded-lg" />)}
                  </div>
                ) : (
                  <div className="space-y-0.5 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Xếp hạng tuần</p>
                    {weeklyLeaderboard.map((player, i) => {
                      const isActive = player.userId === currentUserId;
                      const displayName = player.displayName || "Học sinh";

                      return (
                        <div
                          key={player.userId}
                          className={cn(
                            "flex items-center justify-between p-1.5 rounded-lg transition-all border",
                            isActive
                              ? "bg-sky-50 border-sky-100 shadow-sm"
                              : "bg-white border-transparent hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "w-3 text-[7px] font-bold text-center",
                              i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-400" : "text-slate-300"
                            )}>
                              {i + 1}
                            </span>
                            <div className="w-5 h-5 rounded-md bg-slate-100 border border-white shadow-sm flex items-center justify-center font-bold text-[7px] text-slate-700 overflow-hidden shrink-0">
                              {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                displayName[0]?.toUpperCase() || "?"
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={cn(
                                "text-[9px] font-bold truncate max-w-[60px]",
                                isActive ? "text-sky-900" : "text-slate-600"
                              )}>
                                {displayName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn(
                              "text-[8px] font-bold leading-tight",
                              isActive ? "text-sky-600" : "text-slate-700"
                            )}>
                              {player.weeklyXp.toLocaleString()}
                            </p>
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

      {/* ── Footer Action ────────────────────────────────────── */}
      <button 
        onClick={onLogout}
        className="w-full flex items-center gap-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-[9px] uppercase tracking-widest group shrink-0"
      >
        <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white transition-colors">
          <LogOut size={12} />
        </div>
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}


