import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SeedOptionsFormProps {
  options: any
  setOptions: (o: any) => void
}

export function SeedOptionsForm({ options, setOptions }: SeedOptionsFormProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100/50 transition-colors"
      >
        <span>Tùy chỉnh dữ liệu ảo</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="px-4 pb-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max XP Tháng 3</label>
                <Input 
                  type="number" 
                  value={options.xpMarch} 
                  onChange={e => setOptions({...options, xpMarch: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max XP Tháng 4</label>
                <Input 
                  type="number" 
                  value={options.xpApril} 
                  onChange={e => setOptions({...options, xpApril: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max XP Tháng 5</label>
                <Input 
                  type="number" 
                  value={options.xpMay} 
                  onChange={e => setOptions({...options, xpMay: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Chuỗi Max (Ngày)</label>
                <Input 
                  type="number" 
                  value={options.maxStreak} 
                  onChange={e => setOptions({...options, maxStreak: parseInt(e.target.value)})}
                  className="h-8 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200/50">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Phân bổ thời gian học (Heatmap)</label>
                <select 
                  value={options.timeDistribution} 
                  onChange={e => setOptions({...options, timeDistribution: e.target.value})}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold px-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="random">Ngẫu nhiên (8h - 20h)</option>
                  <option value="evening">Tối ưu buổi tối (17h - 23h)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Câu hỏi Chat tùy chỉnh</label>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Số HS hỏi:</label>
                    <input 
                      type="number" 
                      value={options.customQuestionCount} 
                      onChange={e => setOptions({...options, customQuestionCount: parseInt(e.target.value)})}
                      className="w-10 h-6 border border-slate-200 rounded text-[10px] font-bold text-center"
                    />
                  </div>
                </div>
                <textarea 
                  value={options.customQuestion} 
                  onChange={e => setOptions({...options, customQuestion: e.target.value})}
                  placeholder="Nhập câu hỏi muốn chèn vào chat logs..."
                  className="w-full h-16 p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium resize-none focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <p className="text-[8px] text-slate-400 italic">Dữ liệu thực tế sẽ được sinh ngẫu nhiên dựa trên các tham số bạn cấu hình ở trên.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
