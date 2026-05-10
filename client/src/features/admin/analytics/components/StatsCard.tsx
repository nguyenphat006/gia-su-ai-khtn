import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: number
}

export function StatsCard({ label, value, icon: Icon, color, trend }: StatsCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden"
    >
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-[0.03]", color)}></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1.5">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-900 leading-tight">{value}</h4>
            {trend && <span className="text-[10px] font-bold text-emerald-500">+{trend}%</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
