import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Award, Target, Flame } from "lucide-react";
import { cn, getRank, RANKS } from "@/lib/utils";
import { ChallengePanel } from "@/components/gamification/ChallengePanel";

interface SidebarProps {
  studentData: any;
  leaderboard: any[];
  currentUserId: string;
}

export default function Sidebar({
  studentData,
  leaderboard,
  currentUserId,
}: SidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<"ranking" | "stats">("stats");

  return (
    <aside className="hidden lg:flex lg:col-span-3 lg:order-1 space-y-6 overflow-hidden flex-col h-full">
      {/* XP & Level Card */}
      <div className="bg-white rounded-[2rem] p-8 shadow-md border border-sky-50/50 flex-shrink-0 relative overflow-hidden group">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-black uppercase text-[10px] tracking-[0.2em]">
              Cấp độ hiện tại
            </h3>
            <span className="text-4xl font-display font-black text-sky-600 tracking-tighter">
              {(studentData?.xp || 0).toLocaleString()}
              <span className="text-xs text-black font-black uppercase ml-2 tracking-widest">
                EXP
              </span>
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-200">
              {getRank(studentData?.xp || 0).name}
            </span>
            {studentData?.streak && studentData.streak > 1 && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-200">
                <Flame size={12} className="fill-orange-500" />
                {studentData.streak} Ngày
              </div>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner p-0.5 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(
                ((studentData?.xp || 0) /
                  (getRank(studentData?.xp || 0).max === Infinity
                    ? 1
                    : getRank(studentData?.xp || 0).max)) *
                  100,
                100
              )}%`,
            }}
            className="bg-sky-500 h-full rounded-full shadow-[0_0_8px_rgba(2,132,199,0.4)]"
          />
        </div>
        <p className="text-[10px] text-right text-black font-black uppercase tracking-widest">
          {getRank(studentData?.xp || 0).max !== Infinity
            ? `+${
                getRank(studentData?.xp || 0).max +
                1 -
                (studentData?.xp || 0)
              } EXP ĐẾN ${
                RANKS[
                  RANKS.findIndex(
                    (r) =>
                      r.name === getRank(studentData?.xp || 0).name
                  ) + 1
                ]?.name?.toUpperCase() || ""
              }`
            : "Cấp độ tối đa"}
        </p>
      </div>

      {/* Sidebar Tabs */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-md border border-sky-50/50 overflow-hidden flex flex-col">
        <div className="flex items-center p-2 bg-slate-50/50">
          <button
            onClick={() => setSidebarTab("stats")}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
              sidebarTab === "stats"
                ? "bg-white text-sky-600 shadow-sm border border-slate-100"
                : "text-black font-bold hover:text-sky-500"
            )}
          >
            <Target size={14} /> Thử thách
          </button>
          <button
            onClick={() => setSidebarTab("ranking")}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
              sidebarTab === "ranking"
                ? "bg-white text-sky-600 shadow-sm border border-slate-100"
                : "text-black font-bold hover:text-sky-500"
            )}
          >
            <Trophy size={14} /> Xếp hạng
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {sidebarTab === "stats" ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="h-full"
              >
                <ChallengePanel studentData={studentData} />
              </motion.div>
            ) : (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-black uppercase text-[10px] tracking-[0.2em]">
                    Bảng xếp hạng tuần
                  </h3>
                  <Award size={16} className="text-orange-500" />
                </div>
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                  {leaderboard.map((player, i) => {
                    const isActive = player.id === currentUserId;
                    const rankDisplay = (i + 1)
                      .toString()
                      .padStart(2, "0");
                    const rawName =
                      player.displayName || "Học sinh";
                    const displayName = isActive
                      ? studentData?.displayName || rawName
                      : rawName;

                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all border",
                          isActive
                            ? "bg-sky-50 border-sky-100 shadow-sm"
                            : "bg-white border-transparent hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <span
                            className={cn(
                              "w-5 text-[10px] font-black",
                              isActive
                                ? "text-sky-700"
                                : "text-black"
                            )}
                          >
                            {rankDisplay}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-black overflow-hidden">
                            {player.photoURL ? (
                              <img
                                src={player.photoURL}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              displayName[0]?.toUpperCase() ||
                              "?"
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-bold truncate max-w-[100px]",
                              isActive
                                ? "text-sky-900"
                                : "text-black"
                            )}
                          >
                            {displayName}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-black",
                            isActive
                              ? "text-sky-600"
                              : "text-black text-opacity-70"
                          )}
                        >
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
    </aside>
  );
}
