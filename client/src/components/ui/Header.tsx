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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  "/admin": "Hệ thống quản trị",
};

const MODE_NAMES: Record<string, string> = {
  "quiz": "Thử thách Quiz",
  "flashcard": "Thẻ ghi nhớ",
  "mindmap": "Sơ đồ tư duy",
  "chat": "Hỏi đáp AI",
  "history": "Lịch sử học tập",
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
    <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm shrink-0">
      {/* ── Left: Breadcrumbs ────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider overflow-hidden">
        <Home size={14} className="text-slate-300 shrink-0" />
        <ChevronRight size={12} className="text-slate-200 shrink-0" />
        <span className="text-sky-600 bg-sky-50 px-2 sm:px-3 py-1 rounded-lg border border-sky-100/50 truncate">
          {pageName}
        </span>
      </nav>

      {/* ── Right: User Info & Actions ────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-auto shrink-0">
        <button className="relative p-2 text-slate-400 hover:text-sky-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent sm:p-2.5">
          <Bell size={18} className="sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-px h-5 bg-slate-100 hidden xs:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ y: -1 }}
              className="flex items-center gap-2 p-1 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100 cursor-pointer shadow-sm hover:shadow-md hover:bg-white transition-all pr-2 sm:pr-4 sm:gap-3 sm:p-1.5 outline-none"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-100 rounded-md sm:rounded-lg border border-sky-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                {studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                  <img
                    src={studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-sky-600 font-bold text-xs sm:text-base uppercase">
                    {(studentData?.displayName || user.displayName)?.[0]}
                  </div>
                )}
              </div>
              <div className="hidden xs:block">
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">
                  {user.role === "STUDENT" ? "Học sinh" : (user.role === "TEACHER" ? "Giáo viên" : "Quản trị viên")}
                </p>
                <p className="text-[11px] sm:text-sm font-bold text-slate-900 leading-none truncate max-w-[80px] sm:max-w-none">
                  {studentData?.displayName || user.displayName}
                </p>
              </div>
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
                onClick={() => navigate("/admin/ai-config")}
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
}
