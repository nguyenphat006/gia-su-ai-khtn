// ========================
// AUTH TYPES — Pure Interfaces
// ========================

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface AuthClass {
  id: string;
  code: string;
  name: string;
  grade: number;
  academicYear: string;
}

export interface StudentProfile {
  studentCode: string;
  grade: number;
  avatarUrl: string | null;
}

export interface TeacherProfile {
  employeeCode: string | null;
  subject: string | null;
  avatarUrl: string | null;
}

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
export type UserStatus = "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  class: AuthClass | null;
  studentProfile: StudentProfile | null;
  teacherProfile: TeacherProfile | null;
}

export interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isInitialized: boolean;
}
