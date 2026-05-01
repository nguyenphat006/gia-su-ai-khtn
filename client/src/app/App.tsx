import { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AuthFeature from "@/features/auth/AuthFeature";
import AppLayout from "@/app/AppLayout";
import ProfileEditModal from "@/components/ui/ProfileEditModal";
import { useAuth } from "@/hooks/useAuth";
import { type AuthenticatedUser } from "@/features/auth/types";
import { Toaster } from "sonner";

// ── Lazy-loaded Pages (Route-based Code Splitting) ──────────────
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const ArenaPage = lazy(() => import("@/pages/ArenaPage"));
const TeacherPage = lazy(() => import("@/pages/TeacherPage"));

const AdminLayout = lazy(() => import("@/app/AdminLayout"));
const SystemConfigPage = lazy(() => import("@/pages/admin/SystemConfigPage"));
const KnowledgeBasePage = lazy(() => import("@/pages/admin/KnowledgeBasePage"));

// ── Type for Outlet Context ─────────────────────────────────────
export interface AppOutletContext {
  user: AuthenticatedUser;
  studentData: any;
  isAdmin: boolean;
  addXP: (amount: number) => void;
  schoolLogo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingLogo: boolean;
}

/** Custom hook for child routes to access shared data */
export function useAppContext() {
  return useOutletContext<AppOutletContext>();
}

// ── Main App Component ──────────────────────────────────────────
export default function App() {
  const {
    user,
    studentData,
    isAdmin,
    isLoading,
    leaderboard,
    addXP,
    schoolLogo,
    login,
    logout,
    refreshUser,
  } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <AnimatePresence mode="wait">
        {isLoading && !user ? (
          <LoadingSpinner key="loader" />
        ) : !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <AuthFeature onLogin={login} />
          </motion.div>
        ) : (
          <>
            {/* Modal bắt buộc đổi mật khẩu nếu user mới kích hoạt hoặc reset */}
            {user.mustChangePassword && (
              <ProfileEditModal
                user={user}
                isOpen={true}
                onClose={() => {
                  // Không cho đóng nếu chưa đổi mật khẩu xong (logic này tùy chọn)
                  refreshUser();
                }}
              />
            )}

            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route
                  element={
                    <AppLayout
                      user={user}
                      studentData={studentData}
                      isAdmin={isAdmin}
                      leaderboard={leaderboard}
                      schoolLogo={schoolLogo}
                      addXP={addXP}
                      isUploading={isUploading}
                      setIsUploading={setIsUploading}
                      onLogout={logout}
                    />
                  }
                >
                  <Route index element={<Navigate to="/chat" replace />} />
                  <Route
                    path="/chat"
                    element={
                      <ChatPage
                        studentName={studentData?.displayName || user.displayName || "Học sinh"}
                        addXP={addXP}
                        userId={user.id}
                      />
                    }
                  />
                  <Route
                    path="/quiz"
                    element={
                      <QuizPage
                        studentName={studentData?.displayName || user.displayName || "Học sinh"}
                        addXP={addXP}
                        userId={user.id}
                      />
                    }
                  />
                  <Route
                    path="/arena"
                    element={
                      <ArenaPage
                        studentName={studentData?.displayName || user.displayName || "Học sinh"}
                        addXP={addXP}
                        totalXP={studentData?.xp || 0}
                      />
                    }
                  />
                  {isAdmin && (
                    <Route
                      path="/teacher"
                      element={
                        <TeacherPage
                          schoolLogo={schoolLogo}
                          onLogoUpload={async (e) => {
                            /* handled in AppLayout */
                          }}
                          isUploadingLogo={isUploading}
                        />
                      }
                    />
                  )}
                  <Route path="*" element={<Navigate to="/chat" replace />} />
                </Route>

                {/* Admin Routes with Separate Layout */}
                {isAdmin && (
                  <Route
                    path="/admin"
                    element={<AdminLayout user={user} isAdmin={isAdmin} onLogout={async () => { await logout(); }} />}
                  >
                    <Route index element={<Navigate to="/admin/ai-config" replace />} />
                    <Route path="ai-config" element={<SystemConfigPage />} />
                    <Route path="knowledge" element={<KnowledgeBasePage />} />
                    {/* Catch-all for undefined admin routes to keep user inside AdminLayout */}
                    <Route path="*" element={<></>} />
                  </Route>
                )}
              </Routes>
            </Suspense>
          </>
        )}
      </AnimatePresence>
    </BrowserRouter>
  );
}
