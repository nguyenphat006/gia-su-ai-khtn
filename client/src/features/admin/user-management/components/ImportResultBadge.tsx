import { motion } from "motion/react"
import { CheckCircle2, X } from "lucide-react"

interface ImportResultBadgeProps {
  result: any
  onClose: () => void
}

export function ImportResultBadge({ result, onClose }: ImportResultBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 flex items-center gap-6 min-w-[320px]"
    >
      <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thành công</p>
          <p className="text-lg font-black text-slate-800">{result.success}</p>
        </div>
      </div>
      
      {result.errors.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <X size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lỗi</p>
            <p className="text-lg font-black text-slate-800">{result.errors.length}</p>
          </div>
        </div>
      )}

      <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:text-slate-600"><X size={16} /></button>
    </motion.div>
  )
}
