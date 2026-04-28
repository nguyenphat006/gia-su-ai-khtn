import { useState } from "react";
import { motion } from "motion/react";
import {
  Settings,
  UserIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { type AuthenticatedUser } from "@/lib/auth";

interface HeaderProps {
  user: AuthenticatedUser;
  studentData: any;
  onProfileEdit: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  studentData,
  onProfileEdit,
  onLogout,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname;

  const navItems = [
    { path: "/chat", label: "TRỢ LÝ HỌC TẬP" },
    { path: "/quiz", label: "ÔN TẬP" },
    { path: "/arena", label: "ĐẤU TRƯỜNG TRÍ TUỆ" },
  ];

  return (
    <>
      <header className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-start hidden md:block">
            <h1 className="text-xl font-bold text-sky-900 leading-none tracking-tight uppercase">
              Gia sư AI KHTN
            </h1>
            <p className="text-[10px] text-black font-black mt-1">
              Khám phá tri thức - Kiến tạo tương lai
            </p>
          </div>
        </div>

        <nav className="hidden md:flex flex-1 justify-evenly px-8 text-sm font-bold text-black font-sans">
          {navItems.map((item) => (
            <HorizontalNavItem
              key={item.path}
              active={activeTab === item.path || (item.path === "/chat" && activeTab === "/")}
              onClick={() => navigate(item.path)}
              label={item.label}
            />
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-black z-50 relative"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-black font-black uppercase tracking-widest">
              Họ và tên
            </p>
            <div
              className="flex items-center group/name cursor-pointer"
              onClick={onProfileEdit}
            >
              <p className="text-sm font-bold text-black group-hover/name:text-sky-600 transition-colors">
                {studentData?.displayName ||
                  user.displayName ||
                  "Đang tải..."}
              </p>
              <Settings
                size={12}
                className="ml-1.5 text-black group-hover/name:text-sky-400 transition-colors"
              />
            </div>
          </div>
          <div className="group relative z-40">
            <motion.div
              whileHover={{
                scale: 1.1,
                boxShadow: "0 0 15px rgba(14, 165, 233, 0.2)",
              }}
              className="w-10 h-10 bg-white rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer shadow-sm transition-all"
            >
              {studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl ? (
                <img
                  src={studentData?.photoURL || user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || ""}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white text-sky-600 font-bold text-lg">
                  {studentData?.displayName?.[0]?.toUpperCase() ||
                    user.displayName?.[0]?.toUpperCase() ||
                    "?"}
                </div>
              )}
            </motion.div>
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={onProfileEdit}
                className="w-full flex items-center gap-3 p-3 text-xs font-bold text-sky-600 hover:bg-sky-50 rounded-xl transition-colors mb-1"
              >
                <UserIcon size={16} />
                Sửa đổi họ tên
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-[80px] left-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-40 flex flex-col gap-2"
          >
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "p-4 rounded-xl text-sm font-bold w-full text-left",
                  activeTab === item.path
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-600"
                )}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HorizontalNavItem({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative pb-1 transition-all border-b-2 flex-1 text-center min-w-[120px]",
        active
          ? "text-sky-600 border-sky-600"
          : "text-black font-bold border-transparent hover:text-sky-600"
      )}
    >
      {label}
      {active && (
        <motion.div
          layoutId="nav-glow"
          className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-sky-600 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
        />
      )}
    </button>
  );
}
