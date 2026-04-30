import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft, Shield, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ADMIN_NAV_CONFIG, NavItem } from "./nav-config";

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function AdminSidebar({ isOpen, setIsOpen, isMobile }: AdminSidebarProps) {
  const location = useLocation();
  
  const sidebarVariants = {
    open: { width: isMobile ? "100%" : "280px", x: 0 },
    closed: { width: isMobile ? "0%" : "84px", x: isMobile ? -300 : 0 },
  };

  return (
    <AnimatePresence mode="wait">
      {(isOpen || !isMobile) && (
        <motion.aside
          initial={isMobile ? "closed" : false}
          animate={isOpen ? "open" : "closed"}
          variants={sidebarVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed inset-y-0 left-0 z-50 bg-[#0F172A] flex flex-col shadow-2xl md:sticky border-r border-white/5",
            !isOpen && !isMobile && "items-center"
          )}
        >
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 shrink-0 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
                <Shield size={22} strokeWidth={2.5} />
              </div>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col leading-tight"
                >
                  <span className="font-black text-white text-base tracking-tight uppercase">Gia Sư AI</span>
                  <span className="text-[10px] font-bold text-sky-400 tracking-[0.1em] uppercase opacity-70 whitespace-nowrap">Console Quản trị</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar scrollbar-dark">
            {ADMIN_NAV_CONFIG.map((group, idx) => (
              <div key={idx} className="space-y-3">
                {isOpen && (
                  <h4 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {group.groupName}
                  </h4>
                )}
                <div className="space-y-1">
                  {group.items.map((item, itemIdx) => (
                    <SidebarItem 
                      key={itemIdx} 
                      item={item} 
                      isSidebarOpen={isOpen} 
                      isMobile={isMobile}
                      closeMobileSidebar={() => setIsOpen(false)}
                      currentPath={location.pathname}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ 
  item, 
  isSidebarOpen, 
  isMobile, 
  closeMobileSidebar,
  currentPath 
}: { 
  item: NavItem; 
  isSidebarOpen: boolean; 
  isMobile: boolean;
  closeMobileSidebar: () => void;
  currentPath: string;
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isParentActive = item.to ? currentPath === item.to : item.subItems?.some(sub => currentPath === sub.to);
  const [isExpanded, setIsExpanded] = useState(isParentActive);

  if (!isSidebarOpen && !isMobile) {
    return (
      <NavLink
        to={item.to || item.subItems?.[0]?.to || "#"}
        className={({ isActive }) => cn(
          "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300",
          isActive || isParentActive
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" 
            : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        <item.icon size={20} />
      </NavLink>
    );
  }

  return (
    <div className="space-y-1">
      {hasSubItems ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300",
            isParentActive 
              ? "text-sky-400 bg-sky-400/5" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <item.icon size={20} className="shrink-0" />
          <span className="flex-1 text-left">{item.title}</span>
          <ChevronDown size={14} className={cn("transition-transform duration-300 opacity-50", isExpanded && "rotate-180")} />
        </button>
      ) : (
        <NavLink 
          to={item.to || "#"}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300",
            isActive 
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
          onClick={() => isMobile && closeMobileSidebar()}
        >
          <item.icon size={20} className="shrink-0" />
          <span>{item.title}</span>
        </NavLink>
      )}

      {/* Sub Items */}
      <AnimatePresence>
        {hasSubItems && isExpanded && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pl-11 space-y-1"
          >
            {item.subItems?.map((sub, idx) => (
              <NavLink
                key={idx}
                to={sub.to}
                className={({ isActive }) => cn(
                  "block py-2 text-[13px] font-bold transition-all duration-200",
                  isActive 
                    ? "text-sky-400" 
                    : "text-slate-500 hover:text-slate-300"
                )}
                onClick={() => isMobile && closeMobileSidebar()}
              >
                {sub.title}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
