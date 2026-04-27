import { useState } from "react";
import { Outlet } from "react-router-dom";
import { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { motion } from "motion/react";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, uploadFile } from "@/lib/firebase";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Footer from "@/components/ui/Footer";
import MobileNav from "@/components/ui/MobileNav";
import ProfileEditModal from "@/components/ui/ProfileEditModal";
import { AnimatePresence } from "motion/react";

interface AppLayoutProps {
  user: User;
  studentData: any;
  isAdmin: boolean;
  leaderboard: any[];
  schoolLogo: string | null;
  addXP: (amount: number) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
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
}: AppLayoutProps) {
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const handleLogout = () => signOut(auth);

  const handleSchoolLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!isAdmin || !file || isUploading) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file, `config/school_logo`);
      await setDoc(
        doc(db, "config", "school"),
        { logoUrl: url },
        { merge: true }
      );
    } catch (error) {
      console.error("Lỗi tải ảnh trường:", error);
      alert("Không thể tải ảnh trường. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      key="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen w-full bg-[#f8fafc] font-sans overflow-hidden"
    >
      <div className="p-6 flex-1 flex flex-col space-y-4 overflow-hidden max-w-[1400px] mx-auto w-full">
        <Header
          user={user}
          studentData={studentData}
          onProfileEdit={() => setShowProfileEdit(true)}
          onLogout={handleLogout}
        />

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <ProfileEditModal
            user={user}
            studentData={studentData}
            onClose={() => setShowProfileEdit(false)}
          />
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          {/* Sidebar - LEFT on desktop */}
          <Sidebar
            studentData={studentData}
            leaderboard={leaderboard}
            currentUserId={user.uid}
          />

          {/* Main Content Area - RIGHT on desktop */}
          <div className="col-span-1 lg:col-span-9 lg:order-2 flex flex-col space-y-6 overflow-hidden h-full">
            <div className="flex-1 glass-card rounded-[2rem] p-8 shadow-sm border border-sky-50/50 overflow-hidden bg-white/40 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {/* Outlet renders the matched child route (ChatPage, QuizPage, etc.) */}
                  <Outlet
                    context={{
                      user,
                      studentData,
                      isAdmin,
                      addXP,
                      schoolLogo,
                      onLogoUpload: handleSchoolLogoUpload,
                      isUploadingLogo: isUploading,
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav isAdmin={isAdmin} />
    </motion.div>
  );
}
