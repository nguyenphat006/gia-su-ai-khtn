import { motion } from "motion/react";
import {
  UserIcon,
  LogOut,
  Bell,
  Search
} from "lucide-react";
import { type AuthenticatedUser } from "@/features/auth/types";

interface HeaderProps {
  user: AuthenticatedUser;
  studentData: any;
  onProfileEdit: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  studentData,
  onProfileEdit,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-2 shrink-0">
      {/* ── Left: Search Bar (Gợi ý thêm để đi thi chuyên nghiệp hơn) ── */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài học, thử thách..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-500/5 transition-all"
          />
        </div>
      </div>

      {/* ── Right: User Info & Actions ────────────────────────── */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-3 text-slate-400 hover:text-sky-500 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="group relative">
          <motion.div
            whileHover={{ y: -1 }}
            onClick={onProfileEdit}
            className="flex items-center gap-3 p-1.5 pr-4 bg-white rounded-2xl border border-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-9 h-9 bg-sky-50 rounded-xl border border-sky-100 overflow-hidden flex-shrink-0">
              {studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                <img
                  src={studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sky-600 font-black text-sm uppercase">
                  {(studentData?.displayName || user.displayName)?.[0]}
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cá nhân</p>
              <p className="text-xs font-black text-slate-900 leading-none">
                {studentData?.displayName || user.displayName}
              </p>
            </div>
          </motion.div>

          {/* Dropdown nhanh */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
             <button onClick={onProfileEdit} className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <UserIcon size={14} /> Hồ sơ của em
             </button>
             <div className="h-px bg-slate-50 my-1 mx-2"></div>
             <button onClick={onLogout} className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={14} /> Đăng xuất
             </button>
          </div>
        </div>
      </div>
    </header>
  );
}
