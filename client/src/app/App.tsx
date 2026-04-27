import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, syncStudentData, checkIfAdmin } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LoginPage from "@/pages/LoginPage";
import AppLayout from "@/app/AppLayout";

// ── Lazy-loaded Pages (Route-based Code Splitting) ──────────────
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const ArenaPage = lazy(() => import("@/pages/ArenaPage"));
const TeacherPage = lazy(() => import("@/pages/TeacherPage"));

// ── Type for Outlet Context ─────────────────────────────────────
export interface AppOutletContext {
  user: User;
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

// ── Helper ──────────────────────────────────────────────────────
const isTeacher = (name?: string) => {
  if (!name) return false;
  const normalized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized === "vu thi thu trang";
};

// ── Main App Component ──────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    // Listen for global school config
    const configUnsubscribe = onSnapshot(
      doc(db, "config", "school"),
      (doc) => {
        if (doc.exists()) {
          setSchoolLogo(doc.data().logoUrl);
        }
      }
    );

    let leaderboardUnsubscribe: (() => void) | null = null;
    let studentUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const syncedData = await syncStudentData(currentUser);
        setStudentData(syncedData);

        // Initial admin check
        const adminStatus =
          (await checkIfAdmin(currentUser.uid)) ||
          isTeacher(currentUser.displayName || "") ||
          currentUser.email === "thutrangdino@gmail.com";
        setIsAdmin(adminStatus);

        // Clean up previous listeners if any
        if (leaderboardUnsubscribe) leaderboardUnsubscribe();
        if (studentUnsubscribe) studentUnsubscribe();

        // Leaderboard listener
        const q = query(
          collection(db, "students"),
          orderBy("xp", "desc"),
          limit(20)
        );
        leaderboardUnsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const rankings = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setLeaderboard(rankings);
          },
          (error) => {
            console.error("Leaderboard error:", error);
          }
        );

        studentUnsubscribe = onSnapshot(
          doc(db, "students", currentUser.uid),
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setStudentData(data);
              if (
                isTeacher(data.displayName) ||
                data.isAdmin ||
                isTeacher(currentUser?.displayName || "")
              ) {
                setIsAdmin(true);
              }
            }
          }
        );
      } else {
        setStudentData(null);
        setIsAdmin(false);
        if (leaderboardUnsubscribe) leaderboardUnsubscribe();
        if (studentUnsubscribe) studentUnsubscribe();
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      configUnsubscribe();
      if (leaderboardUnsubscribe) leaderboardUnsubscribe();
      if (studentUnsubscribe) studentUnsubscribe();
    };
  }, []);

  const addXP = async (amount: number) => {
    if (!user) return;
    const studentRef = doc(db, "students", user.uid);
    let newLevel = studentData?.level || "Tập sự";
    const newXP = (studentData?.xp || 0) + amount;

    if (newXP >= 500) newLevel = "Bác học";
    else if (newXP >= 100) newLevel = "Chuyên gia";

    await updateDoc(studentRef, {
      xp: increment(amount),
      level: newLevel,
    });
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <BrowserRouter>
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
            <LoginPage schoolLogo={schoolLogo} />
          </motion.div>
        ) : (
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
                  />
                }
              >
                <Route
                  index
                  element={<Navigate to="/chat" replace />}
                />
                <Route
                  path="/chat"
                  element={
                    <ChatPage
                      studentName={
                        studentData?.displayName ||
                        user.displayName ||
                        "Học sinh"
                      }
                      addXP={addXP}
                      userId={user.uid}
                    />
                  }
                />
                <Route
                  path="/quiz"
                  element={
                    <QuizPage
                      studentName={
                        studentData?.displayName ||
                        user.displayName ||
                        "Học sinh"
                      }
                      addXP={addXP}
                      userId={user.uid}
                    />
                  }
                />
                <Route
                  path="/arena"
                  element={
                    <ArenaPage
                      studentName={
                        studentData?.displayName ||
                        user.displayName ||
                        "Học sinh"
                      }
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
                <Route
                  path="*"
                  element={<Navigate to="/chat" replace />}
                />
              </Route>
            </Routes>
          </Suspense>
        )}
      </AnimatePresence>
    </BrowserRouter>
  );
}
