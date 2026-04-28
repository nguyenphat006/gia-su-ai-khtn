import { useState } from "react";
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
  Award
} from "lucide-react";
import { cn, getRank, RANKS } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import GamificationFeature from "@/features/gamification/GamificationFeature";
import { SCHOOL_LOGO_URL } from "@/hooks/useAuth";

interface SidebarProps {
  studentData: any;
  leaderboard: any[];
  currentUserId: string;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Sidebar({
  studentData,
  leaderboard,
  currentUserId,
  onLogout
}: SidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<"ranking" | "stats">("stats");
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const navItems = [
    { path: "/chat", label: "Trợ lý AI", icon: MessageSquare, color: "text-sky-500", bg: "bg-sky-50" },
    { path: "/quiz", label: "Ôn tập", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
    { path: "/arena", label: "Đấu trường", icon: Swords, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-white border-r border-slate-100 p-6 space-y-6 shrink-0 relative z-50">
      {/* ── Branding ────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center px-2">
        <div className="w-16 h-16 bg-slate-50 rounded-[1.25rem] border border-slate-100 p-3 mb-3 shadow-sm">
          <img src={SCHOOL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight uppercase">
          Gia sư AI <span className="text-sky-500">KHTN</span>
        </h1>
        <p className="text-[8px] text-slate-400 font-bold mt-1.5 uppercase tracking-[0.2em]">THCS Phước Tân 3</p>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activePath === item.path || (item.path === "/chat" && activePath === "/");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "group w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300",
                isActive 
                  ? `${item.bg} ${item.color} shadow-sm border border-white/50` 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-white"
                )}>
                  <item.icon size={18} />
                </div>
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="opacity-40" />}
            </button>
          );
        })}
      </nav>

      {/* ── XP Card ───────────────────────────────────────────── */}
      <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white relative overflow-hidden shrink-0">
        <div className="absolute -right-2 -top-2 w-12 h-12 bg-sky-500/20 blur-xl"></div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Thành tích</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black">{(studentData?.xp || 0).toLocaleString()}</span>
              <span className="text-[7px] font-bold text-sky-400 uppercase">EXP</span>
            </div>
          </div>
          {studentData?.streak > 1 && (
            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10">
              <Flame size={10} className="text-orange-400 fill-orange-400" />
              <span className="text-[8px] font-black text-white">{studentData.streak}</span>
            </div>
          )}
        </div>
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-1.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((studentData?.xp || 0) / (getRank(studentData?.xp || 0).max || 1000)) * 100, 100)}%` }}
            className="h-full bg-sky-400" 
          />
        </div>
        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">
          {getRank(studentData?.xp || 0).name}
        </p>
      </div>

      {/* ── Tabbed Ranking & Stats ────────────────────────────── */}
      <div className="flex-1 bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden flex flex-col min-h-0 shadow-sm">
        <div className="flex items-center p-1 bg-slate-50/50 m-1.5 rounded-xl border border-slate-100/50">
          <button
            onClick={() => setSidebarTab("stats")}
            className={cn(
              "flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
              sidebarTab === "stats"
                ? "bg-white text-sky-600 shadow-sm border border-slate-200/50"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Target size={12} /> Nhiệm vụ
          </button>
          <button
            onClick={() => setSidebarTab("ranking")}
            className={cn(
              "flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
              sidebarTab === "ranking"
                ? "bg-white text-sky-600 shadow-sm border border-slate-200/50"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Trophy size={12} /> Xếp hạng
          </button>
        </div>

        <div className="px-3 pb-3 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {sidebarTab === "stats" ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="h-full overflow-y-auto custom-scrollbar pt-2"
              >
                <GamificationFeature studentData={studentData} />
              </motion.div>
            ) : (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="h-full flex flex-col pt-2"
              >
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
                  {leaderboard.slice(0, 10).map((player, i) => {
                    const isActive = player.id === currentUserId;
                    const displayName = isActive ? studentData?.displayName || player.displayName : (player.displayName || "Học sinh");

                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl transition-all border",
                          isActive
                            ? "bg-sky-50 border-sky-100"
                            : "bg-white border-transparent hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-4 text-[8px] font-black text-center",
                            isActive ? "text-sky-600" : "text-slate-300"
                          )}>
                            {i + 1}
                          </span>
                          <div className="w-6 h-6 rounded-lg bg-slate-100 border border-white shadow-sm flex items-center justify-center font-black text-[8px] text-slate-700 overflow-hidden shrink-0">
                            {player.photoURL ? (
                              <img src={player.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              displayName[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold truncate max-w-[60px]",
                            isActive ? "text-sky-900" : "text-slate-600"
                          )}>
                            {displayName}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-black",
                          isActive ? "text-sky-600" : "text-slate-400"
                        )}>
                          {(player.xp || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer Action ────────────────────────────────────── */}
      <button 
        onClick={onLogout}
        className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest group"
      >
        <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white transition-colors">
          <LogOut size={14} />
        </div>
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}
