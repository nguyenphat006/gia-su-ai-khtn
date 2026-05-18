import * as React from "react"
import { motion } from "motion/react"
import { ChevronLeft, Zap, Flame, User, GraduationCap, Hash, ShieldCheck, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface StudentProfileCardProps {
  student: any
  loading: boolean
}

export function StudentProfileCard({ student, loading }: StudentProfileCardProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-pulse space-y-6">
        <div className="h-8 w-8 bg-slate-100 rounded-full" />
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-slate-100 rounded-full" />
          <div className="h-6 w-32 bg-slate-100 rounded-lg" />
          <div className="h-4 w-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-slate-50 rounded-xl" />
          <div className="h-10 w-full bg-slate-50 rounded-xl" />
          <div className="h-10 w-full bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate("/admin/analytics")} 
        className="mb-6 -ml-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all gap-1 h-9 px-3"
      >
        <ChevronLeft size={16} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Quay lại</span>
      </Button>

      {/* Avatar & Basic Info */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-tr from-sky-500 to-emerald-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur" />
          <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center">
            {student.studentProfile?.avatarUrl ? (
              <img src={student.studentProfile.avatarUrl} alt={student.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-200" />
            )}
          </div>
          {student.status === "ACTIVE" ? (
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
              <ShieldCheck size={10} className="text-white" />
            </div>
          ) : (
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-rose-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
              <ShieldAlert size={10} className="text-white" />
            </div>
          )}
        </div>

        <h3 className="mt-5 text-xl font-black text-slate-800 uppercase leading-tight">{student.displayName}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">@{student.username}</p>
        
        <div className={cn(
          "mt-3 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
          student.status === "ACTIVE" 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-rose-50 text-rose-600 border-rose-100"
        )}>
          {student.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
        </div>
      </div>

      {/* Details List */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <div className="p-2 bg-white rounded-xl shadow-sm text-sky-500">
            <GraduationCap size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Lớp & Khối</span>
            <span className="text-xs font-black text-slate-700 uppercase">Khối {student.studentProfile?.grade} - {student.class?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500">
            <Hash size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Mã học sinh</span>
            <span className="text-xs font-black text-slate-700 uppercase">{student.studentProfile?.studentCode || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-4 border border-amber-100 relative overflow-hidden group">
          <Zap size={40} className="absolute -right-2 -bottom-2 text-amber-200/50 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="relative z-10">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">Tổng điểm EXP</span>
            <span className="text-2xl font-black text-amber-900 tracking-tight">{student.stats?.totalXp?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-4 border border-rose-100 relative overflow-hidden group">
          <Flame size={40} className="absolute -right-2 -bottom-2 text-rose-200/50 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="relative z-10">
            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-1">Chuỗi ngày học</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-900 tracking-tight">{student.stats?.currentStreak || 0}</span>
              <span className="text-[10px] font-bold text-rose-400 uppercase italic">Kỷ lục: {student.stats?.longestStreak || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
