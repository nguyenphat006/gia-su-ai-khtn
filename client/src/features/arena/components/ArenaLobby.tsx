import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Users, Sword, Zap, Medal, Bot, Shield, Sparkles, Search, Fingerprint, Loader2, Globe, UserRound, X } from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import { ArenaView, UserStats } from "../types";

function StatBox({ label, value, icon, color }: any) {
  const colors: any = { 
    sky: "bg-sky-50 text-sky-600 border-sky-100", 
    orange: "bg-orange-50 text-orange-600 border-orange-100", 
    green: "bg-green-50 text-green-600 border-green-100" 
  };
  return (
    <div className={cn("p-2 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition-all active:scale-95 sm:hover:scale-105 min-w-0 flex flex-col justify-center", colors[color])}>
       <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm shrink-0">{icon}</div>
       <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest mb-0.5 opacity-60 font-sans leading-none">{label}</p>
       <p className="text-xs sm:text-lg font-bold leading-tight break-words">{value}</p>
    </div>
  );
}

interface ArenaLobbyProps {
  studentName: string; totalXP: number; players: any[]; leaderboard: any[]; userStats: UserStats;
  view: ArenaView; setView: (v: ArenaView) => void;
  challengeTarget: string; setChallengeTarget: (t: string) => void;
  incomingChallenge: any; setIncomingChallenge: (c: any) => void;
  sendChallenge: () => void; startAiMatch: () => void;
  getSocket: () => any; setBattleData: (d: any) => void; setStatus: (s: any) => void;
  grade: string;
  findMatch: (sameGrade: boolean) => void;
  isMatching: boolean;
}

export function ArenaLobby({
  studentName, totalXP, players, leaderboard, userStats, view, setView,
  challengeTarget, setChallengeTarget, incomingChallenge, setIncomingChallenge,
  sendChallenge, startAiMatch, getSocket, setBattleData, setStatus, grade,
  findMatch, isMatching
}: ArenaLobbyProps) {
  const socket = getSocket();
  const [matchType, setMatchType] = useState<"same-grade" | "global">("same-grade");
  
  const onlinePlayers = players.filter(p => p.grade === grade || p.username === studentName);

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-6 px-3 sm:px-0 h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar">
      {/* View Switcher - Fixed size */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-sky-100 w-fit mx-auto shadow-sm shrink-0">
         <button 
           onClick={() => setView("main")} 
           className={cn(
             "px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all", 
             view === "main" ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-sky-50"
           )}
         >
           <Sword size={12} className="sm:w-3.5 sm:h-3.5" />
           Sảnh đấu
         </button>
         <button 
           onClick={() => setView("leaderboard")} 
           className={cn(
             "px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all", 
             view === "leaderboard" ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-sky-50"
           )}
         >
           <Trophy size={12} className="sm:w-3.5 sm:h-3.5" />
           Bảng xếp hạng
         </button>
      </div>

      {view === "leaderboard" ? (
        <div className="max-w-4xl mx-auto w-full flex-1 min-h-0">
           <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 border border-sky-50 shadow-lg relative overflow-hidden h-full flex flex-col">
              <h3 className="text-xl sm:text-2xl font-bold text-sky-900 mb-1 shrink-0">BXH Đấu Trường</h3>
              <p className="text-[9px] sm:text-xs text-slate-500 font-bold mb-4 sm:mb-6 uppercase tracking-tight shrink-0">Top 10 chiến binh xuất sắc nhất</p>
              
              <div className="space-y-2 sm:space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                 {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                   <div key={idx} className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all", idx === 0 ? "bg-orange-50 border-orange-200 shadow-sm" : (idx === 1 ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"))}>
                      <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base shadow-sm border shrink-0", idx === 0 ? "bg-orange-400 text-white border-orange-300" : (idx === 1 ? "bg-slate-300 text-white border-slate-200" : "bg-sky-50 text-sky-600 border-sky-100"))}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-sky-900 text-sm sm:text-base uppercase tracking-tight leading-tight break-words">
                          {entry.displayName || entry.username}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-xl font-bold text-sky-600 leading-none">
                          {entry.totalScore}
                        </p>
                        <p className="text-[7px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">EXP</p>
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-20 text-slate-300 font-bold italic text-sm">Chưa có dữ liệu.</div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 min-h-0">
          <div className="lg:col-span-8 space-y-4 sm:space-y-6 flex flex-col min-h-0">
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 border border-sky-50 shadow-md overflow-hidden relative flex-1 flex flex-col min-h-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 opacity-50" />
                
                <div className="relative z-10 flex flex-col h-full min-h-0">
                    <div className="flex items-center justify-between mb-4 sm:mb-8 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Sword size={20} className="sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sky-900 text-lg sm:text-xl tracking-tight uppercase leading-tight">Thách Đấu Tri Thức</h3>
                            <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hệ thống đấu trí thời gian thực</p>
                          </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
                      {/* PvP Card */}
                      <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white shadow-lg relative flex flex-col min-h-[9rem] sm:min-h-[11rem]">
                        <h4 className="text-base sm:text-lg font-bold mb-1 relative z-10 uppercase tracking-tight">Thách đấu đôi</h4>
                        <p className="text-[8px] sm:text-[10px] text-sky-100 opacity-80 mb-4 font-medium relative z-10 leading-tight">Thi tài trực tiếp với bạn bè</p>
                        <Users size={50} className="absolute -right-2 -bottom-2 opacity-20 pointer-events-none sm:w-16 sm:h-16" />
                        
                        <div className="mt-auto relative z-10 space-y-2">
                          {incomingChallenge ? (
                             <div className="text-center bg-white/10 p-2 sm:p-3 rounded-xl backdrop-blur-md border border-white/10">
                               <p className="text-[9px] font-bold mb-2 text-sky-100 truncate">
                                 Lời mời từ: <span className="font-bold text-white">{incomingChallenge.username}</span>
                               </p>
                               <div className="flex gap-1.5">
                                 <button onClick={() => { socket?.emit("reject-challenge", { challengerId: incomingChallenge.id }); setIncomingChallenge(null); }} className="flex-1 bg-white/20 hover:bg-white/30 py-1.5 rounded-lg text-[8px] uppercase font-bold">Từ chối</button>
                                 <button onClick={() => { socket?.emit("accept-challenge", { challengerId: incomingChallenge.id }); setBattleData({ challengerId: incomingChallenge.id, target: { id: socket?.id } }); setStatus("challenge-config"); setIncomingChallenge(null); }} className="flex-1 bg-orange-500 hover:bg-orange-600 py-1.5 uppercase rounded-lg text-[8px] font-bold">Đồng ý</button>
                               </div>
                             </div>
                          ) : (
                            <>
                              <div className="relative">
                                <Fingerprint size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                                <input 
                                    type="text" 
                                    placeholder="Tên đối thủ..." 
                                    value={challengeTarget} 
                                    onChange={(e) => setChallengeTarget(e.target.value)} 
                                    className="w-full bg-white/10 border border-white/20 focus:border-white/60 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 outline-none placeholder:text-white/40 text-[10px] sm:text-xs font-bold transition-all" 
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                {challengeTarget.trim() ? (
                                    <button onClick={sendChallenge} className="flex-1 bg-white text-sky-700 hover:bg-sky-50 py-2 sm:py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all">Gửi mời</button>
                                ) : (
                                    <div className="flex w-full gap-2">
                                        <div className="flex-1 p-0.5 bg-white/10 rounded-lg flex gap-1 items-center">
                                            <button onClick={() => setMatchType("same-grade")} className={cn("flex-1 rounded-md text-[7px] font-bold uppercase py-1.5", matchType === "same-grade" ? "bg-white text-sky-700 shadow-sm" : "text-white/60")}>Khối</button>
                                            <button onClick={() => setMatchType("global")} className={cn("flex-1 rounded-md text-[7px] font-bold uppercase py-1.5", matchType === "global" ? "bg-white text-sky-700 shadow-sm" : "text-white/60")}>Tất cả</button>
                                        </div>
                                        <button onClick={() => findMatch(matchType === "same-grade")} disabled={isMatching} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-[9px] font-bold uppercase shadow-md flex items-center justify-center gap-1.5">
                                            {isMatching ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                            {isMatching ? "Đang ghép" : "Ghép"}
                                        </button>
                                    </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* AI Card */}
                      <div 
                        className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white shadow-lg group cursor-pointer relative overflow-hidden min-h-[9rem] sm:min-h-[11rem] flex flex-col active:scale-[0.98] transition-all" 
                        onClick={startAiMatch}
                      >
                        <Bot size={50} className="absolute -right-2 -bottom-2 opacity-20 group-hover:scale-110 transition-transform sm:w-16 sm:h-16" />
                        <h4 className="text-base sm:text-lg font-bold mb-1 uppercase tracking-tight">Đấu với AI</h4>
                        <p className="text-purple-100 text-[8px] sm:text-[10px] mb-4 leading-tight font-medium">Thử thách trí tuệ AI</p>
                        <div className="mt-auto">
                          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all">
                            <Sparkles size={12} /> Thiết lập
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0 mt-auto">
                      <StatBox label="TL thắng" value={userStats.total > 0 ? `${Math.round((userStats.wins/userStats.total)*100)}%` : "0%"} icon={<Zap size={10} />} color="sky" />
                      <StatBox label="Bậc" value={getRank(totalXP).name} icon={<Shield size={10} />} color="orange" />
                      <StatBox label="Kinh nghiệm" value={totalXP.toLocaleString()} icon={<Sparkles size={10} />} color="green" />
                    </div>
                </div>
              </div>
          </div>

          {/* Online Players Column */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 border border-sky-50 shadow-md flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between mb-4 sm:mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <h4 className="text-[10px] font-bold text-black uppercase tracking-widest">Đang Online</h4>
                    </div>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8px] font-bold text-slate-500 uppercase">Khối {grade}</span>
                </div>
                
                <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1">
                    {onlinePlayers.length > 0 ? onlinePlayers.map(p => {
                      const isMe = p.username === studentName;
                      return (
                        <div key={p.id} className={cn("flex flex-col gap-1 p-2 sm:p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group", isMe && "bg-sky-50/50 border-sky-100")}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-bold text-[10px] shrink-0">
                                {isMe ? <UserRound size={14} /> : p.username?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5"><p className="text-[11px] font-bold text-slate-800 leading-tight uppercase break-words">{p.username}</p>{isMe && <span className="text-[6px] bg-sky-100 text-sky-700 px-1 py-0.5 rounded font-bold uppercase">Bạn</span>}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <p className={cn("text-[7px] font-bold uppercase tracking-widest", p.status === "in-battle" ? "text-orange-500" : "text-green-500")}>
                                        {p.status === "in-battle" ? "Đang đấu" : "Sẵn sàng"}
                                    </p>
                                    <span className="text-[7px] font-bold text-slate-400 truncate opacity-50">Mã: {p.studentCode || "---"}</span>
                                </div>
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                        <div className="text-center py-10 text-slate-300 font-bold italic text-xs uppercase tracking-widest">Không có ai online.</div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 shrink-0">
                    <Globe size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[8px] text-slate-500 leading-tight font-medium uppercase tracking-tight">Dùng <b>Ghép nhanh</b> để tìm đối thủ các khối khác.</p>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
