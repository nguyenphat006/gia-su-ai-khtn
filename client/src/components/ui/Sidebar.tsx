import { memo } from "react";
import { 
  MessageSquare, 
  BookOpen, 
  Swords, 
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { SCHOOL_LOGO_URL } from "@/hooks/useAuth";

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar = memo(({
  onLogout
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const navItems = [
    { path: "/chat", label: "Trợ lý AI", icon: MessageSquare, color: "text-sky-500", bg: "bg-sky-50" },
    { path: "/quiz", label: "Ôn tập", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
    { path: "/arena", label: "Đấu trường", icon: Swords, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[100dvh] bg-white border-r border-slate-100 p-4 space-y-6 shrink-0 relative z-50">
      {/* ── Branding ────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center px-2 shrink-0">
        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] border border-slate-100 p-4 mb-4 shadow-sm flex items-center justify-center">
          <img src={SCHOOL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight uppercase">
          Gia sư AI <span className="text-sky-500">KHTN</span>
        </h1>
        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em]">THCS Phước Tân 3</p>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 pt-4">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Menu chính</p>
        {navItems.map((item) => {
          const isActive = activePath === item.path || (item.path === "/chat" && activePath === "/");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "group w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-300",
                isActive 
                  ? `${item.bg} ${item.color} shadow-sm border border-white/50` 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl transition-all shadow-sm",
                  isActive ? "bg-white" : "bg-slate-50 group-hover:bg-white"
                )}>
                  <item.icon size={18} />
                </div>
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="opacity-40" />}
            </button>
          );
        })}
      </nav>

      {/* ── Footer Action ────────────────────────────────────── */}
      <button 
        onClick={onLogout}
        className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest group shrink-0 border border-transparent hover:border-red-100"
      >
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors shadow-sm text-slate-400 group-hover:text-red-500">
          <LogOut size={16} />
        </div>
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
});

export default Sidebar;
