import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { 
  Trophy, 
  MessageSquare, 
  BookOpen, 
  History,
  LayoutDashboard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { adminAnalyticsService } from "./services/analytics.service"
import { StudentProfileCard } from "./components/student-detail/StudentProfileCard"
import { StudentArenaTab } from "./components/student-detail/StudentArenaTab"
import { StudentRevisionTab } from "./components/student-detail/StudentRevisionTab"
import { StudentChatTab } from "./components/student-detail/StudentChatTab"
import { StudentActivityTab } from "./components/student-detail/StudentActivityTab"

export default function StudentDetailIndex() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<"arena" | "revision" | "chat" | "activity">("arena");
  const [loading, setLoading] = React.useState(true);
  const [student, setStudent] = React.useState<any>(null);

  const fetchStudentDetail = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Mock hoặc thực tế gọi API lấy detail user
      const res = await adminAnalyticsService.getStudentDetail(id);
      setStudent(res.data.user || res.data); // Support cả 2 format tùy backend
    } catch (error) {
      console.error("Lỗi khi tải thông tin học sinh:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  const tabs = [
    { id: "arena", label: "Đấu trường", icon: Trophy },
    { id: "revision", label: "Ôn tập", icon: BookOpen },
    { id: "chat", label: "Hội thoại AI", icon: MessageSquare },
    { id: "activity", label: "Lịch sử", icon: History },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 xl:col-span-3">
          <StudentProfileCard student={student} loading={loading} />
        </div>

        {/* Right Column: Activity Tabs */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative",
                  activeTab === tab.id ? "text-sky-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="active-student-tab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-100" />
                )}
                <tab.icon size={14} className="relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "arena" && <StudentArenaTab userId={id || ""} />}
            {activeTab === "revision" && <StudentRevisionTab userId={id || ""} />}
            {activeTab === "chat" && <StudentChatTab userId={id || ""} />}
            {activeTab === "activity" && <StudentActivityTab userId={id || ""} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
