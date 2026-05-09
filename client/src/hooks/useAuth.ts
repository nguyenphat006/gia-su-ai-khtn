import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loginWithServer,
  refreshSession,
  logoutFromServer,
  fetchCurrentUser,
} from "../features/auth/service";
import type { AuthenticatedUser, LoginInput } from "../features/auth/types";

export const SCHOOL_LOGO_URL =
  "https://thcsphuoctan3.edu.vn/wp-content/uploads/2024/03/LOGO-THCS-PHUOC-TAN-3-326x245.jpg";

export interface AppStudentView {
  displayName: string;
  xp: number;
  weeklyXp: number;
  points: number;
  level: string;
  streak: number;
  photoURL: string | null;
  username: string;
  role: string;
  className: string | null;
}

const LEVELS = [
  { minXp: 0, maxXp: 250, title: "NHÀ KHOA HỌC NHÍ" },
  { minXp: 250, maxXp: 500, title: "SỨ GIẢ CHÂN LÝ" },
  { minXp: 500, maxXp: 1000, title: "BẬC THẦY THỰC NGHIỆM" },
  { minXp: 1000, maxXp: 1500, title: "HÀN LÂM HỌC SĨ" },
  { minXp: 1500, maxXp: 2000, title: "NHÀ KIẾN TẠO TINH HOA" },
  { minXp: 2000, maxXp: 2500, title: "Học Giả Tinh Anh" },
  { minXp: 2500, maxXp: Infinity, title: "Vị Thần Tri Thức" },
];

function deriveStudentView(user: AuthenticatedUser | null): AppStudentView | null {
  if (!user) {
    return null;
  }

  const xp = user.stats?.totalXp || 0;
  const levelInfo = LEVELS.find(l => xp >= l.minXp && xp < l.maxXp) || LEVELS[0];

  return {
    displayName: user.displayName,
    xp: xp,
    weeklyXp: user.stats?.weeklyXp || 0,
    points: user.stats?.points || 0,
    level: levelInfo.title,
    streak: user.stats?.currentStreak || 0,
    photoURL: user.studentProfile?.avatarUrl || user.teacherProfile?.avatarUrl || null,
    username: user.username,
    role: user.role,
    className: user.class?.name || null,
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolLogo] = useState<string | null>(SCHOOL_LOGO_URL);

  const studentData = useMemo(() => deriveStudentView(user), [user]);
  const isAdmin = user?.role === "ADMIN" || user?.role === "TEACHER";

  // Khởi tạo session khi load app (Dựa vào httpOnly cookie)
  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      // Safety timeout: if auth check takes more than 10s, fallback to login
      const timeoutId = setTimeout(() => {
        if (isMounted && isLoading) {
          console.warn("[useAuth] Auth check timed out, falling back to guest state.");
          setIsLoading(false);
        }
      }, 10000);

      try {
        console.log("[useAuth] Bootstrapping session...");
        const activeUser = await fetchCurrentUser();
        if (isMounted) setUser(activeUser);
      } catch (error: any) {
        console.warn("[useAuth] Session bootstrap failed:", error.message);
        if (isMounted) setUser(null);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setIsLoading(false);
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const activeUser = await loginWithServer(input);
    setUser(activeUser);
    return activeUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFromServer();
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setUser(null);
    }
  }, []);

  const addXP = useCallback((amount: number) => {
    if (!amount || !user) return;
    // Logic cập nhật XP sẽ được bổ sung sau
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const activeUser = await fetchCurrentUser();
      setUser(activeUser);
      return activeUser;
    } catch (error) {
      console.error("Lỗi khi refresh user:", error);
      return null;
    }
  }, []);

  return {
    user,
    studentData,
    isAdmin,
    isLoading,
    addXP,
    schoolLogo,
    login,
    logout,
    refreshUser
  };
}
