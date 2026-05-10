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
            <p className="text-[8px] text-slate-400 italic">Dữ liệu thực tế sẽ được sinh ngẫu nhiên từ 20% đến 100% giá trị Max bạn chọn.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
