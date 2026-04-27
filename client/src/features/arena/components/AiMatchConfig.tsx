import { motion } from "motion/react";
import { Bot, Zap } from "lucide-react";
import { BattleConfig } from "../types";

interface AiMatchConfigProps {
  battleConfig: BattleConfig;
  setBattleConfig: React.Dispatch<React.SetStateAction<BattleConfig>>;
  errorMsg: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AiMatchConfig({ battleConfig, setBattleConfig, errorMsg, onCancel, onConfirm }: AiMatchConfigProps) {
  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 md:p-16 rounded-[3.5rem] border-4 border-orange-100 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Bot size={180} className="text-orange-600" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-12">
             <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-200">
                <Bot size={32} />
             </div>
             <div>
                <h3 className="text-3xl font-display font-black text-orange-900 tracking-tight uppercase">CẤU HÌNH THÁCH ĐẤU</h3>
                <p className="text-orange-800/60 font-bold text-xs uppercase tracking-widest mt-1">Sẵn sàng chưa? Hãy nhập Khối và Chủ đề em muốn đấu nhé!</p>
             </div>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center text-sm font-bold animate-shake">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 mb-12">
             <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">📚 Chủ đề thách đấu</label>
                <input 
                  type="text" 
                  value={battleConfig.topic}
                  onChange={(e) => setBattleConfig(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Ví dụ: Quang hợp, Nguyên tử..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-orange-900"
                />
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">🔢 Số câu hỏi (Tối đa 20)</label>
                <input 
                  type="number" 
                  min="1"
                  max="20"
                  value={battleConfig.count}
                  onChange={(e) => setBattleConfig(prev => ({ ...prev, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-orange-900"
                />
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">📦 Khối lớp</label>
                <select 
                  value={battleConfig.grade}
                  onChange={(e) => setBattleConfig(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-orange-900 appearance-none"
                >
                   <option value="">Chọn khối lớp...</option>
                   <option value="6">Khối 6</option>
                   <option value="7">Khối 7</option>
                   <option value="8">Khối 8</option>
                   <option value="9">Khối 9</option>
                </select>
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">📝 Dạng bài thách đấu</label>
                <select 
                  value={battleConfig.type}
                  onChange={(e) => setBattleConfig(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 outline-none focus:border-orange-500 transition-all font-bold text-orange-900 appearance-none"
                >
                   <option value="Trắc nghiệm">Trắc nghiệm</option>
                   <option value="Tự luận">Tự luận</option>
                   <option value="Trắc nghiệm & Tự luận">Trắc nghiệm & Tự luận</option>
                </select>
             </div>

             <div className="md:col-span-2 p-5 bg-orange-50 rounded-3xl border border-orange-100">
                <div className="flex gap-4 items-start">
                   <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 mt-1">
                      <Zap size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">Chế độ thi:</p>
                      <p className="text-xs text-orange-900/70 font-medium leading-relaxed italic">
                         {battleConfig.type === "Trắc nghiệm" && "Thử thách phản xạ và độ chính xác: Câu hỏi nhận biết nhanh, hình ảnh/đồ thị, ứng dụng thực tế."}
                         {battleConfig.type === "Tự luận" && "Thử thách khả năng diễn đạt và hiểu sâu: Câu hỏi 'Tại sao', so sánh/phân tích, sáng tạo, giải quyết vấn đề, tính toán."}
                         {battleConfig.type === "Trắc nghiệm & Tự luận" && "Kết hợp 50% Trắc nghiệm & 50% Tự luận: Thử thách toàn diện từ tốc độ đến chiều sâu kiến thức."}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-5 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-[11px]"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={onConfirm}
              disabled={!battleConfig.topic || !battleConfig.grade}
              className="flex-[2] bg-orange-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-orange-200 hover:bg-orange-700 disabled:opacity-50 transition-all text-sm uppercase tracking-[0.2em] transform active:scale-95"
            >
              BẮT ĐẦU
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
