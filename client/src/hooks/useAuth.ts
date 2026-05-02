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
  const isAdmin = user?.role === "ADMIN" || user?.role === "TEACHER";

  // Khởi tạo session khi load app (Dựa vào httpOnly cookie)
  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        // apiClient sẽ tự động thử /refresh nếu /me trả về 401
        const activeUser = await fetchCurrentUser();
        if (isMounted) setUser(activeUser);
      } catch (error) {
        console.log("Không có phiên đăng nhập hợp lệ hoặc không thể tự động làm mới.");
        if (isMounted) setUser(null);
      } finally {
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
    leaderboard,
    addXP,
    schoolLogo,
    login,
    logout,
    refreshUser
  };
}
