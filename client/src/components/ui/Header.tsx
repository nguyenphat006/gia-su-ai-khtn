import { motion } from "motion/react";
import {
  UserIcon,
  LogOut,
  Bell,
  ChevronRight,
  Home,
  Shield
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { type AuthenticatedUser } from "@/features/auth/types";

interface HeaderProps {
  user: AuthenticatedUser;
  studentData: any;
  onProfileEdit: () => void;
  onLogout: () => void;
}

const ROUTE_NAMES: Record<string, string> = {
  "/chat": "Trợ lý AI",
  "/quiz": "Ôn tập kiến thức",
  "/arena": "Đấu trường trí tuệ",
  "/teacher": "Bảng điều khiển giáo viên",
};

export default function Header({
  user,
  studentData,
  onProfileEdit,
  onLogout,
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const pageName = ROUTE_NAMES[path] || "Trang chủ";
  const canAccessAdmin = user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm shrink-0">
      {/* ── Left: Breadcrumbs ────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
        <Home size={14} className="text-slate-300" />
        <ChevronRight size={12} className="text-slate-200" />
        <span className="text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100/50">
          {pageName}
        </span>
      </nav>

      {/* ── Right: User Info & Actions ────────────────────────── */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2.5 text-slate-400 hover:text-sky-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>

        <div className="group relative">
          <motion.div
            whileHover={{ y: -1 }}
            onClick={onProfileEdit}
            className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer shadow-sm hover:shadow-md hover:bg-white transition-all"
          >
            <div className="w-10 h-10 bg-sky-100 rounded-lg border border-sky-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
              {studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                <img
                  src={studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sky-600 font-black text-base uppercase">
                  {(studentData?.displayName || user.displayName)?.[0]}
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                {user.role === "STUDENT" ? "Học sinh" : (user.role === "TEACHER" ? "Giáo viên" : "Quản trị viên")}
              </p>
              <p className="text-sm font-black text-slate-900 leading-none">
                {studentData?.displayName || user.displayName}
              </p>
            </div>
          </motion.div>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform group-hover:translate-y-0 translate-y-2">
             <button onClick={onProfileEdit} className="w-full flex items-center gap-3 p-3 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-colors mb-1">
                <div className="p-2 bg-slate-50 rounded-lg"><UserIcon size={16} /></div>
                Hồ sơ cá nhân
             </button>
             
             {canAccessAdmin && (
               <button onClick={() => navigate("/admin/ai-config")} className="w-full flex items-center gap-3 p-3 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors mb-1">
                  <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-500"><Shield size={16} /></div>
                  Quản trị hệ thống
               </button>
             )}

             <div className="h-px bg-slate-50 my-1 mx-2"></div>
             <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <div className="p-2 bg-red-50/50 rounded-lg"><LogOut size={16} /></div>
                Đăng xuất
             </button>
          </div>
        </div>
      </div>
    </header>
  );
}
