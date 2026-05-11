import { motion } from "motion/react";
import {
  UserIcon,
  LogOut,
  ChevronRight,
  Home,
  Shield,
  ChevronDown,
  Zap,
  Flame
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { type AuthenticatedUser } from "@/features/auth/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { memo } from "react";

interface HeaderProps {
  user: AuthenticatedUser;
  studentData: any;
  onProfileEdit: () => void;
  onLogout: () => void;
  onAchievementToggle: () => void;
}

const ROUTE_NAMES: Record<string, string> = {
  "/chat": "Trợ lý AI",
  "/quiz": "Ôn tập kiến thức",
  "/arena": "Đấu trường trí tuệ",
  "/admin": "Hệ thống quản trị",
};

const MODE_NAMES: Record<string, string> = {
  "quiz": "Thử thách Quiz",
  "flashcard": "Thẻ ghi nhớ",
  "mindmap": "Sơ đồ tư duy",
  "chat": "Hỏi đáp AI",
  "history": "Lịch sử học tập",
};

const Header = memo(({
  user,
  studentData,
  onProfileEdit,
  onLogout,
  onAchievementToggle,
}: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get("mode");
  const topic = searchParams.get("topic");

  let pageName = ROUTE_NAMES[path] || "Trang chủ";
  
  // Dynamic title for Quiz module
  if (path === "/quiz" && mode && mode !== "menu") {
    const modeName = MODE_NAMES[mode] || "Ôn tập";
    pageName = topic ? `${modeName}: ${topic}` : modeName;
  }

  const canAccessAdmin = user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm shrink-0 gap-4">
      {/* ── Left: Breadcrumbs ────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider overflow-hidden">
        <Home size={14} className="text-slate-300 shrink-0" />
        <ChevronRight size={12} className="text-slate-200 shrink-0" />
        <span className="text-sky-600 bg-sky-50 px-2 sm:px-3 py-1 rounded-lg border border-sky-100/50 truncate">
          {pageName}
        </span>
      </nav>

      {/* ── Center: Mini Stats (Click to open Panel) ─────────── */}
      <div className="hidden md:flex items-center gap-3">
         <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAchievementToggle}
            className="flex items-center gap-4 bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-800 shadow-lg shadow-slate-200"
         >
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
               <Zap size={14} className="text-sky-400" />
               <span className="text-xs font-black text-white">{(studentData?.xp || 0).toLocaleString()}</span>
               <span className="text-[7px] font-bold text-sky-400 uppercase tracking-widest">EXP</span>
            </div>
            <div className="flex items-center gap-1.5">
               <Flame size={14} className="text-orange-400 fill-orange-400" />
               <span className="text-xs font-black text-white">{studentData?.streak || 0}</span>
               <span className="text-[7px] font-bold text-orange-400 uppercase tracking-widest">NGÀY</span>
            </div>
         </motion.button>
      </div>

      {/* ── Right: User Info & Actions ────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto shrink-0">
        {/* Mobile Mini Toggle (Stats) */}
        <button 
          onClick={onAchievementToggle}
          className="md:hidden p-2 bg-slate-50 border border-slate-100 rounded-xl text-orange-500 shadow-sm active:scale-95"
        >
          <Flame size={18} className="fill-orange-500" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ y: -1 }}
              className="flex items-center gap-2.5 p-1.5 sm:p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer shadow-sm hover:shadow-md hover:bg-white transition-all pr-3 sm:pr-5 outline-none"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-sky-100 rounded-lg sm:rounded-xl border border-sky-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                {studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                  <img
                    src={studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-sky-600 font-bold text-sm sm:text-lg uppercase">
                    {(studentData?.displayName || user.displayName)?.[0]}
                  </div>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-0.5">
                  {user.role === "STUDENT" ? "Học sinh" : (user.role === "TEACHER" ? "Giáo viên" : "Quản trị viên")}
                </p>
                <p className="text-[11px] sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[100px] sm:max-w-none">
                  {studentData?.displayName || user.displayName}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-300 ml-1 shrink-0 hidden xs:block" />
            </motion.div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 mt-2">
            <DropdownMenuLabel className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tài khoản</p>
              <p className="text-xs font-bold text-slate-800 truncate">{studentData?.displayName || user.displayName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onProfileEdit}
              className="flex items-center gap-3 p-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors cursor-pointer"
            >
              <div className="p-2 bg-slate-50 rounded-lg"><UserIcon size={16} /></div>
              Hồ sơ cá nhân
            </DropdownMenuItem>
            
            {canAccessAdmin && (
              <DropdownMenuItem 
                onClick={() => navigate("/admin/analytics")}
                className="flex items-center gap-3 p-3 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer"
              >
                <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-500"><Shield size={16} /></div>
                Quản trị hệ thống
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onLogout}
              className="flex items-center gap-3 p-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <div className="p-2 bg-red-50/50 rounded-lg"><LogOut size={16} /></div>
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});

export default Header;
