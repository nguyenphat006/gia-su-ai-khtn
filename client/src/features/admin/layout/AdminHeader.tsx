import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  LogOut, 
  ChevronDown,
  Bell,
  ChevronRight,
  Menu,
  X,
  UserIcon
} from "lucide-react";
import { type AuthenticatedUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { motion } from "motion/react";
import { ADMIN_NAV_CONFIG } from "./nav-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  user: AuthenticatedUser;
  onLogout: () => Promise<void>;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function AdminHeader({ user, onLogout, toggleSidebar, isSidebarOpen }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Logic to calculate breadcrumbs and title
  const { title, breadcrumbs } = useMemo(() => {
    const path = location.pathname;
    let foundTitle = "Tổng quan";
    let crumbs: { label: string; to?: string }[] = [{ label: "Quản trị" }];

    for (const group of ADMIN_NAV_CONFIG) {
      for (const item of group.items) {
        if (item.to === path) {
          foundTitle = item.title;
          crumbs.push({ label: item.title });
          return { title: foundTitle, breadcrumbs: crumbs };
        }
        if (item.subItems) {
          const sub = item.subItems.find(s => s.to === path);
          if (sub) {
            foundTitle = sub.title;
            crumbs.push({ label: item.title });
            crumbs.push({ label: sub.title });
            return { title: foundTitle, breadcrumbs: crumbs };
          }
          
          // Handle dynamic detail routes (e.g., /admin/knowledge/123)
          const isDetail = item.subItems.find(s => path.startsWith(s.to + "/"));
          if (isDetail) {
             foundTitle = isDetail.title + " (Chi tiết)";
             crumbs.push({ label: item.title });
             crumbs.push({ label: isDetail.title, to: isDetail.to });
             crumbs.push({ label: "Chi tiết" });
             return { title: foundTitle, breadcrumbs: crumbs };
          }
        }
      }
    }

    return { title: foundTitle, breadcrumbs: crumbs };
  }, [location.pathname]);

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-5 bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-sm shrink-0">
      {/* Left: Hamburger (Mobile Only) & Title/Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <button 
          onClick={toggleSidebar}
          className="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all border border-slate-100 shrink-0"
        >
          {isSidebarOpen ? <X size={18} className="sm:w-5 sm:h-5" /> : <Menu size={18} className="sm:w-5 sm:h-5" />}
        </button>

        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-sm sm:text-xl font-bold text-slate-900 tracking-tight leading-tight uppercase truncate">
            {title}
          </h1>
          <nav className="hidden xs:flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest overflow-hidden py-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                {idx > 0 && <ChevronRight size={10} className="text-slate-300" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-sky-600 transition-colors truncate max-w-[60px] sm:max-w-none">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(idx === breadcrumbs.length - 1 && "text-sky-600/80", "truncate max-w-[80px] sm:max-w-none")}>
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
        <button className="relative p-2 sm:p-2.5 text-slate-400 hover:text-sky-500 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all">
          <Bell size={18} className="sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-px h-5 sm:h-6 bg-slate-100 hidden xs:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ y: -1 }}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-2 sm:pr-4 bg-slate-50 rounded-lg sm:rounded-2xl border border-slate-100 cursor-pointer shadow-sm hover:shadow-md hover:bg-white transition-all outline-none"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-slate-200 rounded-md sm:rounded-xl border border-slate-300 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                {user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                  <img src={user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500 font-black text-xs sm:text-base uppercase">
                    {(user.displayName || user.email)?.[0]}
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                  {user.role}
                </p>
                <p className="text-sm font-black text-slate-900 leading-none">
                  {user.displayName || "Quản trị viên"}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden xs:block" />
            </motion.div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 mt-2">
            <DropdownMenuLabel className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đang đăng nhập</p>
              <p className="text-xs font-black text-slate-800 truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => navigate("/")}
              className="flex items-center gap-3 p-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors cursor-pointer"
            >
              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white"><UserIcon size={16} /></div>
              Về trang chủ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { void onLogout(); }}
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
