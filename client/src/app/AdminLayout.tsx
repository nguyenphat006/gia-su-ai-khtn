import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Settings, BookOpen, LogOut, ArrowLeft } from "lucide-react";
import { type AuthenticatedUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  user: AuthenticatedUser;
  isAdmin: boolean;
  onLogout: () => Promise<void>;
}

export default function AdminLayout({ user, isAdmin, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();

  if (!isAdmin) {
    return <div className="p-10 text-center text-red-500 font-bold">Không có quyền truy cập</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full overflow-hidden font-sans">
      {/* Top Header Menu */}
      <div className="bg-white border-b border-slate-200 px-6 shrink-0 shadow-sm z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          
          <div className="flex items-center gap-8 h-full">
            <div className="font-display font-black text-slate-800 text-xl flex items-center gap-3">
              <button 
                onClick={() => navigate("/")}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                title="Quay lại trang chính"
              >
                <ArrowLeft size={20} />
              </button>
              Quản trị Hệ thống
            </div>
            
            <div className="flex items-center h-full gap-2">
              <NavLink 
                to="/admin/ai-config"
                className={({ isActive }) => cn(
                  "h-full px-4 flex items-center gap-2 border-b-2 font-bold text-sm transition-colors",
                  isActive 
                    ? "border-sky-500 text-sky-600" 
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                )}
              >
                <Settings size={16} />
                Cấu hình Prompt
              </NavLink>

              <NavLink 
                to="/admin/knowledge"
                className={({ isActive }) => cn(
                  "h-full px-4 flex items-center gap-2 border-b-2 font-bold text-sm transition-colors",
                  isActive 
                    ? "border-sky-500 text-sky-600" 
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                )}
              >
                <BookOpen size={16} />
                Kho Tri Thức
              </NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-slate-700 hidden sm:block">
              Xin chào, {user.displayName || "Admin"}
            </div>
            <button
              onClick={() => { void onLogout(); }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar relative">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-100/30 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto h-full relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
