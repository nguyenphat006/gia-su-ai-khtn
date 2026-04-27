import { motion } from "motion/react";
import { BattleConfig, ConfigRole } from "../types";

interface PvPMatchConfigProps {
  configRole: ConfigRole;
  battleConfig: BattleConfig;
  setBattleConfig: React.Dispatch<React.SetStateAction<BattleConfig>>;
  battleData: any;
  challengeRejects: number;
  setChallengeRejects: React.Dispatch<React.SetStateAction<number>>;
  setConfigRole: (role: ConfigRole) => void;
  setStatus: (status: any) => void;
  getSocket: () => any;
}

export function PvPMatchConfig({
  configRole, battleConfig, setBattleConfig, battleData,
  challengeRejects, setChallengeRejects, setConfigRole, setStatus, getSocket
}: PvPMatchConfigProps) {
  const socket = getSocket();

  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 md:p-16 rounded-[3.5rem] border border-sky-50 shadow-2xl relative overflow-hidden"
      >
         <h3 className="text-3xl font-display font-black text-sky-900 mb-8 uppercase tracking-tight text-center">
           {configRole === "proposer" ? "Tạo chủ đề thách đấu" : configRole === "waiting" ? "Chờ đối thủ" : "Chủ đề thách đấu"}
         </h3>

         {configRole === "proposer" ? (
           <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">📚 Chủ đề đề xuất</label>
                <input 
                  type="text" 
                  value={battleConfig.topic}
                  onChange={(e) => setBattleConfig(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:border-sky-500 font-bold text-sky-900 mt-2"
                />
              </div>
              <button 
                onClick={() => {
                  socket?.emit("send-challenge-config", { targetId: battleData.opponent.id, config: { ...battleConfig, type: "Trắc nghiệm", count: 10 } });
                  setConfigRole("waiting");
                }}
                disabled={!battleConfig.topic}
                className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-sky-700 disabled:opacity-50"
              >
                Đề xuất chủ đề
              </button>
           </div>
         ) : configRole === "waiting" ? (
           <div className="space-y-8 text-center p-8">
              <div className="w-16 h-16 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-xl font-black text-sky-900">Đang chờ đối thủ xử lý...</p>
           </div>
         ) : (
           <div className="space-y-8 text-center">
              <div className="p-8 bg-sky-50 rounded-3xl border border-sky-100">
                 <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2">Chủ đề thách đấu:</p>
                 <p className="text-2xl font-black text-sky-900">{battleConfig.topic || "KHTN THCS"}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setChallengeRejects(prev => {
                      const next = prev + 1;
                      if (next >= 5) {
                        alert("Thách đấu không thành công. Bạn đã từ chối quá 5 lần.");
                        socket?.emit("cancel-challenge-flow", { targetId: battleData.opponent.id });
                        setStatus("lobby");
                        return 0;
                      }
                      setConfigRole("proposer");
                      socket?.emit("reject-config", { opponentId: battleData.opponent.id });
                      setBattleConfig(prevConfig => ({ ...prevConfig, topic: "" }));
                      return next;
                    });
                  }}
                  className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
                >
                  Đề xuất chủ đề khác
                </button>
                <button 
                  onClick={() => socket?.emit("accept-config", { opponentId: battleData.opponent.id, config: battleConfig })}
                  className="flex-1 py-5 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-sky-700 shadow-xl shadow-sky-200 transition-all"
                >
                  Xác nhận
                </button>
              </div>
           </div>
         )}
      </motion.div>
    </div>
  );
}
