import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Settings, 
  BookOpen, 
  Shield,
  LayoutDashboard,
  Users,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { type AuthenticatedUser } from "@/features/auth/types";
import { AdminHeader } from "@/features/admin/layout/AdminHeader";
import { AdminSidebar } from "@/features/admin/layout/AdminSidebar";
import { useState, useEffect, useMemo } from "react";
import { ADMIN_NAV_CONFIG } from "@/features/admin/layout/nav-config";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  user: AuthenticatedUser;
  isAdmin: boolean;
  onLogout: () => Promise<void>;
}

export default function AdminLayout({ user, isAdmin, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if route exists in config
  const isRouteValid = useMemo(() => {
    const path = location.pathname;
    // Allow root admin path
    if (path === "/admin" || path === "/admin/") return true;

    for (const group of ADMIN_NAV_CONFIG) {
      for (const item of group.items) {
        if (item.to === path) return true;
        if (item.subItems) {
          if (item.subItems.some(s => s.to === path || path.startsWith(s.to + "/"))) return true;
        }
      }
    }
    return false;
  }, [location.pathname]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-800 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-md animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2 text-red-600 uppercase">Truy cập bị từ chối</h1>
          <p className="text-slate-500 mb-6 font-medium">Bạn không có quyền quản trị viên để truy cập khu vực này.</p>
          <Button 
            onClick={() => navigate("/")}
            className="w-full h-12 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B1120] w-full overflow-hidden font-sans text-slate-900">
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AdminSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 md:rounded-[3rem] my-2 mr-2 shadow-2xl border-l border-white/5 transition-all duration-500">
        <div className="p-3 pb-0">
          <AdminHeader 
            user={user} 
            onLogout={onLogout} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto h-full relative z-10">
            {isRouteValid ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                <Outlet />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-12 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase">Tính năng đang phát triển</h2>
                <p className="text-slate-500 max-w-md mb-8 font-medium leading-relaxed">
                  Trang bạn đang truy cập hiện chưa được khai báo hoặc đang trong quá trình hoàn thiện. Vui lòng quay lại sau!
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/ai-config")}
                  className="rounded-2xl font-bold h-11 px-6 gap-2 border-slate-200"
                >
                  <ChevronLeft size={18} />
                  Về trang cấu hình AI
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
