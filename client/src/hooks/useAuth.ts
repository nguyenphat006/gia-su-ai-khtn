import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit } from "firebase/firestore";
import { auth, db, syncStudentData, checkIfAdmin } from "@/lib/firebase";

export const SCHOOL_LOGO_URL = "https://thcsphuoctan3.edu.vn/wp-content/uploads/2024/03/LOGO-THCS-PHUOC-TAN-3-326x245.jpg";

const isTeacher = (name?: string) => {
  if (!name) return false;
  const normalized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized === "vu thi thu trang";
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  // Gắn mặc định Logo trường theo yêu cầu
  const [schoolLogo, setSchoolLogo] = useState<string | null>(SCHOOL_LOGO_URL);

  useEffect(() => {
    // Listen for global school config if it exists, otherwise keep default
    const configUnsubscribe = onSnapshot(
      doc(db, "config", "school"),
      (doc) => {
        if (doc.exists() && doc.data().logoUrl) {
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

        const adminStatus =
          (await checkIfAdmin(currentUser.uid)) ||
          isTeacher(currentUser.displayName || "") ||
          currentUser.email === "thutrangdino@gmail.com";
        setIsAdmin(adminStatus);

        if (leaderboardUnsubscribe) leaderboardUnsubscribe();
        if (studentUnsubscribe) studentUnsubscribe();

        const q = query(collection(db, "students"), orderBy("xp", "desc"), limit(20));
        leaderboardUnsubscribe = onSnapshot(q, (snapshot) => {
            const rankings = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setLeaderboard(rankings);
        });

        studentUnsubscribe = onSnapshot(doc(db, "students", currentUser.uid), (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setStudentData(data);
              if (isTeacher(data.displayName) || data.isAdmin || isTeacher(currentUser?.displayName || "")) {
                setIsAdmin(true);
              }
            }
        });
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

  return { user, studentData, isAdmin, isLoading, leaderboard, addXP, schoolLogo };
}
