import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import MobileNav from "@/components/ui/MobileNav";
import ProfileEditModal from "@/components/ui/ProfileEditModal";
import { AnimatePresence } from "motion/react";
import { type AuthenticatedUser } from "@/features/auth/types";

interface AppLayoutProps {
  user: AuthenticatedUser;
  studentData: any;
  isAdmin: boolean;
  leaderboard: any[];
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
  leaderboard,
  schoolLogo,
  addXP,
  isUploading,
  setIsUploading,
  onLogout,
}: AppLayoutProps) {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-[#fcfdfe] font-sans overflow-hidden">
      {/* ── Sidebar: Fixed Left ────────────────────────────────── */}
      <Sidebar
        studentData={studentData}
        leaderboard={leaderboard}
        currentUserId={user.id}
        isAdmin={isAdmin}
        onLogout={() => {
          void onLogout();
        }}
      />

      {/* ── Main Dashboard Area: Grid 2 rows ───────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-100/20 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none"></div>
        
        {/* Row 1: Header (Fixed Height) */}
        <div className="px-6 py-4 relative z-40">
           <Header
              user={user}
              studentData={studentData}
              onProfileEdit={() => setShowProfileEdit(true)}
              onLogout={() => {
                void onLogout();
              }}
            />
        </div>

        {/* Row 2: Content Workspace (Flexible Height) */}
        <main className="flex-1 px-6 pb-6 relative z-10 min-h-0">
          <div className="h-full w-full bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.995 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.005 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col overflow-hidden"
              >
                <div className="flex-1 h-full min-h-0 flex flex-col">
                  <Outlet
                    context={{
                      user,
                      studentData,
                      isAdmin,
                      addXP,
                      schoolLogo,
                      onLogoUpload: async () => {}, // Handled elsewhere
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
