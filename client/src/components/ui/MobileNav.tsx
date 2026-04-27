import { MessageSquare, BookOpen, Trophy, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isAdmin: boolean;
}

export default function MobileNav({ isAdmin }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname;

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white shadow-2xl rounded-[1.5rem] border border-sky-100 p-2 z-[60] flex items-center justify-around">
      <MobileNavItem
        active={activeTab === "/" || activeTab === "/chat"}
        onClick={() => navigate("/chat")}
        icon={<MessageSquare size={20} />}
        label="Trợ lý"
      />
      <MobileNavItem
        active={activeTab === "/quiz"}
        onClick={() => navigate("/quiz")}
        icon={<BookOpen size={20} />}
        label="Ôn tập"
      />
      <MobileNavItem
        active={activeTab === "/arena"}
        onClick={() => navigate("/arena")}
        icon={<Trophy size={20} />}
        label="Đấu trường"
      />
      {isAdmin && (
        <MobileNavItem
          active={activeTab === "/teacher"}
          onClick={() => navigate("/teacher")}
          icon={<Settings size={20} />}
          label="Quản lý"
        />
      )}
    </div>
  );
}

function MobileNavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
        active ? "text-sky-600 bg-sky-50" : "text-black opacity-60"
      )}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tighter">
        {label}
      </span>
    </button>
  );
}
