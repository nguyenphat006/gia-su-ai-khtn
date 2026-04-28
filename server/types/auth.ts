import { AccountStatus, Role } from "@prisma/client";

export interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticatedRequestUser {
  userId: string;
  username: string;
  role: Role;
  sessionId: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: Role;
  status: AccountStatus;
  mustChangePassword: boolean;
  class: {
    id: string;
    code: string;
    name: string;
    grade: number;
    academicYear: string;
  } | null;
  studentProfile: {
    studentCode: string;
    grade: number;
    avatarUrl: string | null;
  } | null;
  teacherProfile: {
    employeeCode: string | null;
    subject: string | null;
    avatarUrl: string | null;
  } | null;
  stats: {
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date | null;
  } | null;
}

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}
