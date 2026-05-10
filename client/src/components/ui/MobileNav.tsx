import { MessageSquare, BookOpen, Swords, LayoutDashboard } from "lucide-react";
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

  // Danh sách các item, Chat sẽ được đưa vào giữa
  const items = [
    { path: "/quiz", label: "Ôn tập", icon: BookOpen },
    { path: "/arena", label: "Đấu trường", icon: Swords },
    { path: "/chat", label: "Trợ lý AI", icon: MessageSquare },
  ];

  if (isAdmin) {
    items.push({ path: "/admin/analytics", label: "Quản trị", icon: LayoutDashboard });
  }

  // Logic sắp xếp: Đưa Chat vào giữa mảng để hiển thị chính giữa cân đối
  const sortedItems = [...items];
  const chatIdx = sortedItems.findIndex(i => i.path === "/chat");
  if (chatIdx !== -1) {
    const chatItem = sortedItems.splice(chatIdx, 1)[0];
    const middle = Math.floor(sortedItems.length / 2);
    sortedItems.splice(middle, 0, chatItem);
  }

  return (
    <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100] flex items-center justify-center">
      <nav className="flex items-center justify-around w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-100 px-2 py-2 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.12)] relative">
        {sortedItems.map((item) => {
          const isActive = activeTab === item.path || (item.path === "/chat" && activeTab === "/");
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-1 py-1 relative min-w-[64px]"
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-300",
                isActive 
                  ? "text-sky-600 bg-sky-50 shadow-inner scale-110" 
                  : "text-slate-400 hover:text-slate-600"
              )}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-tight transition-colors",
                isActive ? "text-sky-600" : "text-slate-400"
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="active-dot-nav"
                  className="absolute -bottom-0.5 w-1 h-1 bg-sky-500 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
