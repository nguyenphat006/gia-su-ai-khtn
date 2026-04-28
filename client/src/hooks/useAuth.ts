import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activateFirstTimeAccount,
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  loginStudentWithServer,
  loginTeacherWithServer,
  logoutFromServer,
  refreshSessionWithServer,
  type ActivateAccountInput,
  type AuthenticatedUser,
  type LoginInput,
} from "@/lib/auth";

export const SCHOOL_LOGO_URL =
  "https://thcsphuoctan3.edu.vn/wp-content/uploads/2024/03/LOGO-THCS-PHUOC-TAN-3-326x245.jpg";

export interface AppStudentView {
  displayName: string;
  xp: number;
  level: string;
  streak: number;
  photoURL: string | null;
  username: string;
  role: string;
  className: string | null;
}

function deriveStudentView(user: AuthenticatedUser | null): AppStudentView | null {
  if (!user) {
    return null;
  }

  return {
    displayName: user.displayName,
    xp: 0,
    level: user.role === "STUDENT" ? "Tập sự" : "Người hướng dẫn",
    streak: 0,
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
  const [leaderboard] = useState<any[]>([]);

  const studentData = useMemo(() => deriveStudentView(user), [user]);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!accessToken && !refreshToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const session = await refreshSessionWithServer(refreshToken || undefined);
        if (isMounted) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Không thể khôi phục phiên đăng nhập:", error);
        clearAuthSession();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginStudent = useCallback(async (input: LoginInput) => {
    const session = await loginStudentWithServer(input);
    setUser(session.user);
    return session.user;
  }, []);

  const loginTeacher = useCallback(async (input: LoginInput) => {
    const session = await loginTeacherWithServer(input);
    setUser(session.user);
    return session.user;
  }, []);

  const activateAccount = useCallback(async (input: ActivateAccountInput) => {
    const session = await activateFirstTimeAccount(input);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFromServer();
    } catch (error) {
      console.error("Đăng xuất server thất bại, đang xóa phiên cục bộ:", error);
    } finally {
      clearAuthSession();
      setUser(null);
    }
  }, []);

  const addXP = useCallback((amount: number) => {
    if (!amount || !user) return;

    setUser((current) => {
      if (!current) return current;

      return {
        ...current,
      };
    });
  }, [user]);

  return {
    user,
    studentData,
    isAdmin,
    isLoading,
    leaderboard,
    addXP,
    schoolLogo,
    loginStudent,
    loginTeacher,
    activateAccount,
    logout,
  };
}
