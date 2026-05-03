import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Users, Sword, Zap, Medal, Bot, Shield, Sparkles, Search, Fingerprint, Loader2, Globe, UserRound } from "lucide-react";
import { cn, getRank } from "@/lib/utils";
import { ArenaView, UserStats } from "../types";

function StatBox({ label, value, icon, color }: any) {
  const colors: any = { sky: "bg-sky-50 text-sky-600 border-sky-100", orange: "bg-orange-50 text-orange-600 border-orange-100", green: "bg-green-50 text-green-600 border-green-100" };
  return (
    <div className={cn("p-6 rounded-3xl border text-center transition-all hover:scale-105", colors[color])}>
       <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">{icon}</div>
       <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 font-sans">{label}</p>
       <p className="text-xl font-display font-black">{value}</p>
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-sky-100 w-fit mx-auto shadow-sm">
         <button onClick={() => setView("main")} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", view === "main" ? "bg-sky-600 text-white shadow-lg" : "text-slate-500 hover:bg-sky-50")}><Sword size={16} />Sảnh đấu</button>
         <button onClick={() => setView("leaderboard")} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", view === "leaderboard" ? "bg-sky-600 text-white shadow-lg" : "text-slate-500 hover:bg-sky-50")}><Trophy size={16} />Bảng xếp hạng</button>
      </div>

      {view === "leaderboard" ? (
        <div className="max-w-4xl mx-auto">
           <div className="bg-white rounded-[2.5rem] p-10 border border-sky-50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Trophy size={120} className="text-sky-600" /></div>
              <h3 className="text-3xl font-display font-black text-sky-900 mb-2">Bảng Xếp Hạng Đấu Trường</h3>
              <p className="text-black font-bold mb-10">Top 10 chiến binh tri thức xuất sắc nhất Trường Phước Tân 3</p>
              <div className="space-y-4">
                 {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                   <div key={idx} className={cn("flex items-center gap-6 p-6 rounded-[1.5rem] border transition-all", idx === 0 ? "bg-orange-50 border-orange-200 shadow-orange-100 shadow-md" : (idx === 1 ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"))}>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg shadow-sm border-2", idx === 0 ? "bg-orange-400 text-white border-orange-300" : (idx === 1 ? "bg-slate-300 text-white border-slate-200" : "bg-sky-50 text-sky-600 border-sky-100"))}>{idx + 1}</div>
                      <div className="flex-1"><p className="font-display font-black text-sky-900 text-lg uppercase tracking-tight">{entry.displayName || entry.username}</p><p className="text-xs text-black font-black uppercase tracking-widest">{entry.rank === 1 ? "Bậc kỳ tài" : "Chiến binh"}</p></div>
                      <div className="text-right"><p className="text-2xl font-display font-black text-sky-600">{entry.totalScore}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Tổng điểm tích lũy</p></div>
                   </div>
                 )) : (<div className="text-center py-20 text-slate-400 font-bold italic">Chưa có dữ liệu xếp hạng.</div>)}
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-10 border border-sky-50 shadow-xl shadow-sky-900/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full -mr-32 -mt-32 opacity-50" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Sword size={28} /></div>
                          <div><h3 className="font-display font-black text-sky-900 text-2xl tracking-tight">Thách Đấu Tri Thức</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Hệ thống thi đấu thời gian thực</p></div>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-sky-900">{studentName}</p>
                        <div className="flex items-center gap-3 mt-1 justify-end">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">TL Thắng: <span className="text-sky-600">{userStats.total > 0 ? Math.round((userStats.wins/userStats.total)*100) : 0}%</span></span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng trận: <span className="text-sky-600">{userStats.total}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-[2rem] p-6 text-white shadow-2xl relative flex flex-col min-h-[14rem]">
                        <h4 className="text-xl font-display font-black mb-2 relative z-10">Thách đấu đôi</h4>
                        <Users size={80} className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none" />
                        
                        <div className="mt-auto relative z-10 space-y-3">
                          {incomingChallenge ? (
                             <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                               <p className="text-[11px] font-bold mb-3 text-sky-100">Lời mời từ: <span className="font-black text-white">{incomingChallenge.username}</span></p>
                               <div className="flex gap-2">
                                 <button onClick={() => { socket?.emit("reject-challenge", { challengerId: incomingChallenge.id }); setIncomingChallenge(null); }} className="flex-1 bg-white/20 hover:bg-white/30 py-2.5 outline-none rounded-xl text-[10px] uppercase tracking-widest font-bold">Từ chối</button>
                                 <button onClick={() => { socket?.emit("accept-challenge", { challengerId: incomingChallenge.id }); setBattleData({ challengerId: incomingChallenge.id, target: { id: socket?.id } }); setStatus("challenge-config"); setIncomingChallenge(null); }} className="flex-1 bg-orange-500 hover:bg-orange-600 py-2.5 outline-none tracking-widest uppercase rounded-xl text-[10px] font-bold">Chấp nhận</button>
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
                                    placeholder="Mã HS hoặc Tên đối thủ..." 
                                    value={challengeTarget} 
                                    onChange={(e) => setChallengeTarget(e.target.value)} 
                                    className="w-full bg-white/10 border border-white/20 focus:border-white/60 focus:bg-white/20 rounded-xl pl-10 pr-4 py-3 outline-none placeholder:text-white/40 text-sm font-bold transition-all" 
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                {challengeTarget.trim() ? (
                                    <button 
                                        onClick={sendChallenge} 
                                        className="flex-1 bg-white text-sky-700 hover:bg-sky-50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                    >
                                        Gửi lời mời
                                    </button>
                                ) : (
                                    <div className="flex w-full gap-2">
                                        <div className="flex-1 p-1 bg-white/10 rounded-xl flex gap-1">
                                            <button 
                                                onClick={() => setMatchType("same-grade")}
                                                className={cn("flex-1 rounded-lg text-[8px] font-black uppercase transition-all py-2", matchType === "same-grade" ? "bg-white text-sky-700 shadow-sm" : "text-white/60 hover:text-white")}
                                            >
                                                Cùng khối
                                            </button>
                                            <button 
                                                onClick={() => setMatchType("global")}
                                                className={cn("flex-1 rounded-lg text-[8px] font-black uppercase transition-all py-2", matchType === "global" ? "bg-white text-sky-700 shadow-sm" : "text-white/60 hover:text-white")}
                                            >
                                                Tất cả
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => findMatch(matchType === "same-grade")}
                                            disabled={isMatching}
                                            className="flex-[1.2] bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isMatching ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                            {isMatching ? "Đang ghép..." : "Ghép nhanh"}
                                        </button>
                                    </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-[2rem] p-6 text-white shadow-2xl group cursor-pointer relative overflow-hidden min-h-[14rem] flex flex-col" onClick={startAiMatch}>
                        <Bot size={80} className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xl font-display font-black mb-2">Đấu với AI</h4>
                        <p className="text-purple-100 text-xs mb-8 leading-relaxed font-medium">Thử thách Gia sư AI với các câu hỏi khó.</p>
                        <div className="mt-auto"><button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Sparkles size={14} /> Thiết lập trận đấu</button></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <StatBox label="Tỉ lệ thắng" value={userStats.total > 0 ? `${Math.round((userStats.wins/userStats.total)*100)}%` : "0%"} icon={<Zap size={16} />} color="sky" />
                      <StatBox label="Danh hiệu" value={getRank(totalXP).name} icon={<Shield size={16} />} color="orange" />
                      <StatBox label="Kinh nghiệm" value={totalXP} icon={<Sparkles size={16} />} color="green" />
                    </div>
                </div>
              </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 border border-sky-50 shadow-xl shadow-sky-900/5">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                        <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Chiến binh Online</h4>
                    </div>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500">Khối {grade}</span>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {onlinePlayers.length > 0 ? onlinePlayers.map(p => {
                      const isMe = p.username === studentName;
                      return (
                        <div key={p.id} className={cn("flex flex-col gap-2 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group", isMe && "bg-sky-50/50 border-sky-100")}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 font-black text-xs border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-sm">
                                {isMe ? <UserRound size={18} /> : p.username?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-800 truncate">{p.username}</p>{isMe && <span className="text-[8px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-black uppercase">Bạn</span>}</div>
                                <div className="flex items-center gap-2">
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest", p.status === "in-battle" ? "text-orange-500" : "text-green-500")}>
                                        {p.status === "in-battle" ? "Trong trận" : "Sẵn sàng"}
                                    </p>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Mã: {p.studentCode || "N/A"}</span>
                                </div>
                            </div>
                          </div>
                          {!isMe && p.status === "idle" && (
                            <button 
                                onClick={() => { setChallengeTarget(p.username); sendChallenge(); }}
                                className="ml-14 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-sky-600 text-white py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-sky-700"
                            >
                                Thách đấu ngay
                            </button>
                          )}
                        </div>
                      );
                    }) : (
                        <div className="text-center py-10 text-slate-300 font-bold italic text-xs">Không có ai online cùng khối.</div>
                    )}
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <Globe size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-500 leading-relaxed font-medium">Sử dụng tính năng <b>Ghép nhanh</b> với chế độ <b>Tất cả</b> để tìm đối thủ ở các khối lớp khác.</p>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
