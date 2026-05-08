import { MessageSquare, BookOpen, Swords, Settings } from "lucide-react";
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
    navItems.push({ path: "/admin", label: "Hệ thống", icon: Settings });
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-2 pb-6 z-[60] flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.06)] rounded-t-[1.5rem]">
      {navItems.map((item) => {
        const isActive = activeTab === item.path || (item.path === "/chat" && activeTab === "/");
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="relative flex flex-col items-center gap-1 min-w-[70px] py-1"
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute -top-2 w-10 h-1 bg-sky-500 rounded-full shadow-[0_2px_10px_rgba(14,165,233,0.3)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              isActive ? "text-sky-600 bg-sky-50 shadow-inner" : "text-slate-400 hover:text-slate-600"
            )}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.1em] transition-colors",
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
