import { MessageSquare, BookOpen, Swords, LayoutDashboard, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface MobileNavProps {
  isAdmin: boolean;
}

export default function MobileNav({ isAdmin }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname;

  const navItems = [
    { path: "/chat", label: "Trợ lý", icon: MessageSquare },
    { path: "/quiz", label: "Ôn tập", icon: BookOpen },
    { path: "/arena", label: "Thi đấu", icon: Swords },
  ];

  if (isAdmin) {
    navItems.push({ path: "/teacher", label: "Quản lý", icon: LayoutDashboard });
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 pb-8 z-[60] flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = activeTab === item.path || (item.path === "/chat" && activeTab === "/");
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="relative flex flex-col items-center gap-1 min-w-[64px]"
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute -top-3 w-8 h-1 bg-sky-500 rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              isActive ? "text-sky-600 bg-sky-50" : "text-slate-400"
            )}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest transition-colors",
              isActive ? "text-sky-600" : "text-slate-400"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
