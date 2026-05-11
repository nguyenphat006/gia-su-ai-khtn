import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import AchievementPanel from "@/components/ui/AchievementPanel";
import MobileNav from "@/components/ui/MobileNav";
import ProfileEditModal from "@/components/ui/ProfileEditModal";
import { type AuthenticatedUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  user: AuthenticatedUser;
  studentData: any;
  isAdmin: boolean;
  schoolLogo: string | null;
  addXP: (amount: number) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  onLogout: () => Promise<void>;
}

export default function AppLayout({
  user,
  studentData,
  isAdmin,
  schoolLogo,
  addXP,
  isUploading,
  setIsUploading,
  onLogout,
}: AppLayoutProps) {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(() => {
    const saved = localStorage.getItem("achievementPanelOpen");
    return saved === "true";
  });
  
  const location = useLocation();
  const isChatPage = location.pathname === "/chat" || location.pathname === "/";

  const toggleAchievement = () => {
    setAchievementOpen(prev => {
      const newState = !prev;
      localStorage.setItem("achievementPanelOpen", String(newState));
      return newState;
    });
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#fcfdfe] font-sans overflow-hidden relative">
      {/* ── Background Decorative Accents ────────────────────────── */}
      <div className="hidden sm:block absolute top-0 right-0 w-[600px] h-[600px] bg-sky-100/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none z-0"></div>
      <div className="hidden sm:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none z-0"></div>

      {/* ── Sidebar (Static Left) ─────────────────────────────── */}
      <Sidebar
        onLogout={() => {
          void onLogout();
        }}
      />

      {/* ── Achievement Panel (Fixed Right Drawer) ───────────────── */}
      <AchievementPanel 
        studentData={studentData}
        currentUserId={user.id}
        isOpen={achievementOpen}
        onToggle={toggleAchievement}
      />

      {/* ── Main Workspace Area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* Header Area: Fixed height, always on top */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 relative z-40 shrink-0 flex items-center gap-3 sm:gap-4 h-auto">
          <div className="flex-1 min-w-0">
            <Header
              user={user}
              studentData={studentData}
              onProfileEdit={() => setShowProfileEdit(true)}
              onLogout={() => {
                void onLogout();
              }}
              onAchievementToggle={toggleAchievement}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-3 sm:px-6 pb-[76px] sm:pb-6 relative z-10 min-h-0 flex flex-col">
          <div className="flex-1 bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-[0_-12px_40px_rgba(0,0,0,0.03)] border-t border-x sm:border border-slate-100 relative flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className={cn(
                  "flex-1 flex flex-col min-h-0",
                  !isChatPage && "overflow-y-auto custom-scrollbar"
                )}>
                  <Outlet
                    context={{
                      user,
                      studentData,
                      isAdmin,
                      addXP,
                      schoolLogo,
                      onLogoUpload: async () => { },
                      isUploadingLogo: isUploading,
                    }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Profile Modal */}
        {showProfileEdit && (
          <ProfileEditModal
            user={user}
            isOpen={true}
            onClose={() => setShowProfileEdit(false)}
          />
        )}
      </div>

      {/* Mobile Nav */}
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
