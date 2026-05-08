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
    <div className={cn("p-4 sm:p-6 rounded-2xl sm:rounded-3xl border text-center transition-all active:scale-95 sm:hover:scale-105", colors[color])}>
       <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-sm">{icon}</div>
       <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-0.5 sm:mb-1 opacity-60 font-sans">{label}</p>
       <p className="text-base sm:text-xl font-display font-black truncate">{value}</p>
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
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-10 px-3 sm:px-0">
      {/* View Switcher */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl sm:rounded-2xl border border-sky-100 w-fit mx-auto shadow-sm">
         <button 
           onClick={() => setView("main")} 
           className={cn(
             "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all", 
             view === "main" ? "bg-sky-600 text-white shadow-lg" : "text-slate-500 hover:bg-sky-50"
           )}
         >
           <Sword size={14} className="sm:w-4 sm:h-4" />
           Sảnh đấu
         </button>
         <button 
           onClick={() => setView("leaderboard")} 
           className={cn(
             "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all", 
             view === "leaderboard" ? "bg-sky-600 text-white shadow-lg" : "text-slate-500 hover:bg-sky-50"
           )}
         >
           <Trophy size={14} className="sm:w-4 sm:h-4" />
           Bảng xếp hạng
         </button>
      </div>

      {view === "leaderboard" ? (
        <div className="max-w-4xl mx-auto">
           <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-sky-50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 hidden sm:block"><Trophy size={120} className="text-sky-600" /></div>
              <h3 className="text-2xl sm:text-3xl font-display font-black text-sky-900 mb-1 sm:mb-2">BXH Đấu Trường</h3>
              <p className="text-[10px] sm:text-sm text-slate-500 font-bold mb-6 sm:mb-10 uppercase tracking-tight">Top 10 chiến binh xuất sắc nhất</p>
              
              <div className="space-y-3 sm:space-y-4">
                 {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                   <div key={idx} className={cn("flex items-center gap-3 sm:gap-6 p-4 sm:p-6 rounded-2xl border transition-all", idx === 0 ? "bg-orange-50 border-orange-200 shadow-orange-100 shadow-md" : (idx === 1 ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"))}>
                      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-display font-black text-base sm:text-lg shadow-sm border-2 shrink-0", idx === 0 ? "bg-orange-400 text-white border-orange-300" : (idx === 1 ? "bg-slate-300 text-white border-slate-200" : "bg-sky-50 text-sky-600 border-sky-100"))}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-sky-900 text-base sm:text-lg uppercase tracking-tight truncate">
                          {entry.displayName || entry.username}
                        </p>
                        <p className="text-[10px] text-black font-black uppercase tracking-widest opacity-60 truncate">
                          {entry.rank === 1 ? "Bậc kỳ tài" : "Chiến binh"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-2xl font-display font-black text-sky-600">
                          {entry.totalScore}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">Điểm</p>
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-20 text-slate-300 font-bold italic text-sm">Chưa có dữ liệu xếp hạng.</div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-sky-50 shadow-xl shadow-sky-900/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full -mr-32 -mt-32 opacity-50" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8 sm:mb-12">
                      <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <Sword size={22} className="sm:w-7 sm:h-7" />
                          </div>
                          <div>
                            <h3 className="font-display font-black text-sky-900 text-xl sm:text-2xl tracking-tight uppercase">Thách Đấu Tri Thức</h3>
                            <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Thi đấu thời gian thực</p>
                          </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-sky-900">{studentName}</p>
                        <div className="flex items-center gap-3 mt-1 justify-end">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Thắng: <span className="text-sky-600">{userStats.total > 0 ? Math.round((userStats.wins/userStats.total)*100) : 0}%</span></span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Trận: <span className="text-sky-600">{userStats.total}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                      {/* PvP Card */}
                      <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 text-white shadow-2xl relative flex flex-col min-h-[12rem] sm:min-h-[14rem]">
                        <h4 className="text-lg sm:text-xl font-display font-black mb-1 sm:mb-2 relative z-10">Thách đấu đôi</h4>
                        <p className="text-[10px] sm:text-xs text-sky-100 opacity-80 mb-4 font-bold relative z-10">Thi tài trực tiếp với bạn bè</p>
                        <Users size={60} className="absolute -right-2 -bottom-2 opacity-20 pointer-events-none sm:w-20 sm:h-20" />
                        
                        <div className="mt-auto relative z-10 space-y-3">
                          {incomingChallenge ? (
                             <div className="text-center bg-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/10">
                               <p className="text-[10px] sm:text-[11px] font-bold mb-2 sm:mb-3 text-sky-100 truncate">
                                 Lời mời từ: <span className="font-black text-white">{incomingChallenge.username}</span>
                               </p>
                               <div className="flex gap-2">
                                 <button 
                                   onClick={() => { socket?.emit("reject-challenge", { challengerId: incomingChallenge.id }); setIncomingChallenge(null); }} 
                                   className="flex-1 bg-white/20 hover:bg-white/30 py-2 sm:py-2.5 outline-none rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] uppercase tracking-widest font-bold"
                                 >
                                   Từ chối
                                 </button>
                                 <button 
                                   onClick={() => { socket?.emit("accept-challenge", { challengerId: incomingChallenge.id }); setBattleData({ challengerId: incomingChallenge.id, target: { id: socket?.id } }); setStatus("challenge-config"); setIncomingChallenge(null); }} 
                                   className="flex-1 bg-orange-500 hover:bg-orange-600 py-2 sm:py-2.5 outline-none tracking-widest uppercase rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold shadow-lg"
                                 >
                                   Đồng ý
                                 </button>
                               </div>
                             </div>
                          ) : (
                            <>
                              <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors">
                                    <Fingerprint size={16} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Tên đối thủ..." 
                                    value={challengeTarget} 
                                    onChange={(e) => setChallengeTarget(e.target.value)} 
                                    className="w-full bg-white/10 border border-white/20 focus:border-white/60 focus:bg-white/20 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 outline-none placeholder:text-white/40 text-xs sm:text-sm font-bold transition-all" 
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                {challengeTarget.trim() ? (
                                    <button 
                                        onClick={sendChallenge} 
                                        className="flex-1 bg-white text-sky-700 hover:bg-sky-50 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                    >
                                        Gửi lời mời
                                    </button>
                                ) : (
                                    <div className="flex w-full gap-2">
                                        <div className="flex-1 p-1 bg-white/10 rounded-lg sm:rounded-xl flex gap-1">
                                            <button 
                                                onClick={() => setMatchType("same-grade")}
                                                className={cn("flex-1 rounded-md sm:rounded-lg text-[7px] sm:text-[8px] font-black uppercase transition-all py-1.5 sm:py-2", matchType === "same-grade" ? "bg-white text-sky-700 shadow-sm" : "text-white/60 hover:text-white")}
                                            >
                                                Cùng khối
                                            </button>
                                            <button 
                                                onClick={() => setMatchType("global")}
                                                className={cn("flex-1 rounded-md sm:rounded-lg text-[7px] sm:text-[8px] font-black uppercase transition-all py-1.5 sm:py-2", matchType === "global" ? "bg-white text-sky-700 shadow-sm" : "text-white/60 hover:text-white")}
                                            >
                                                Tất cả
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => findMatch(matchType === "same-grade")}
                                            disabled={isMatching}
                                            className="flex-[1.2] bg-orange-500 hover:bg-orange-600 text-white py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2"
                                        >
                                            {isMatching ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                            {isMatching ? "Đang ghép" : "Ghép nhanh"}
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
                        className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 text-white shadow-2xl group cursor-pointer relative overflow-hidden min-h-[12rem] sm:min-h-[14rem] flex flex-col active:scale-[0.98] transition-all" 
                        onClick={startAiMatch}
                      >
                        <Bot size={60} className="absolute -right-2 -bottom-2 opacity-20 group-hover:scale-110 transition-transform sm:w-20 sm:h-20" />
                        <h4 className="text-lg sm:text-xl font-display font-black mb-1 sm:mb-2 uppercase">Đấu với AI</h4>
                        <p className="text-purple-100 text-[10px] sm:text-xs mb-6 sm:mb-8 leading-relaxed font-medium">Thử thách trí tuệ nhân tạo</p>
                        <div className="mt-auto">
                          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                            <Sparkles size={14} /> 
                            Thiết lập trận đấu
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                      <StatBox label="TL thắng" value={userStats.total > 0 ? `${Math.round((userStats.wins/userStats.total)*100)}%` : "0%"} icon={<Zap size={14} className="sm:w-4 sm:h-4" />} color="sky" />
                      <StatBox label="Bậc" value={getRank(totalXP).name} icon={<Shield size={14} className="sm:w-4 sm:h-4" />} color="orange" />
                      <StatBox label="Kinh nghiệm" value={totalXP} icon={<Sparkles size={14} className="sm:w-4 sm:h-4" />} color="green" />
                    </div>
                </div>
              </div>
          </div>

          {/* Online Players Column */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-sky-50 shadow-xl shadow-sky-900/5">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                        <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Đang Online</h4>
                    </div>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 uppercase">Khối {grade}</span>
                </div>
                
                <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {onlinePlayers.length > 0 ? onlinePlayers.map(p => {
                      const isMe = p.username === studentName;
                      return (
                        <div key={p.id} className={cn("flex flex-col gap-2 p-3 sm:p-4 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-colors border border-transparent hover:border-slate-100 group", isMe && "bg-sky-50/50 border-sky-100")}>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-50 rounded-lg sm:rounded-xl flex items-center justify-center text-sky-600 font-black text-[10px] sm:text-xs border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                {isMe ? <UserRound size={16} className="sm:w-[18px] sm:h-[18px]" /> : p.username?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <p className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-none">{p.username}</p>
                                  {isMe && <span className="text-[7px] bg-sky-100 text-sky-700 px-1 py-0.5 rounded font-black uppercase">Bạn</span>}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                    <p className={cn("text-[7px] sm:text-[8px] font-black uppercase tracking-widest", p.status === "in-battle" ? "text-orange-500" : "text-green-500")}>
                                        {p.status === "in-battle" ? "Trong trận" : "Sẵn sàng"}
                                    </p>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase truncate">Mã: {p.studentCode || "N/A"}</span>
                                </div>
                            </div>
                          </div>
                          {!isMe && p.status === "idle" && (
                            <button 
                                onClick={() => { setChallengeTarget(p.username); sendChallenge(); }}
                                className="ml-11 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-sky-600 text-white py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-sky-700 shadow-sm"
                            >
                                Thách đấu ngay
                            </button>
                          )}
                        </div>
                      );
                    }) : (
                        <div className="text-center py-10 text-slate-300 font-bold italic text-xs">Không có ai online.</div>
                    )}
                </div>

                <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 flex items-start gap-2 sm:gap-3">
                    <Globe size={14} className="text-slate-400 shrink-0 mt-0.5 sm:w-4 sm:h-4" />
                    <p className="text-[8px] sm:text-[9px] text-slate-500 leading-relaxed font-medium">Sử dụng tính năng <b>Ghép nhanh</b> với chế độ <b>Tất cả</b> để tìm đối thủ ở các khối lớp khác.</p>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
