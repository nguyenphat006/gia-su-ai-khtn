import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AuthContext, PublicUser, TokenBundle } from "../types/auth.js";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
} from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  createAccessToken,
  generateRefreshToken,
  getAccessTokenTtlSeconds,
  getRefreshTokenTtlDays,
  hashToken,
} from "../utils/token.js";

const publicUserInclude = {
  class: true,
  studentProfile: true,
  teacherProfile: true,
  stats: true,
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof publicUserInclude;
}>;

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeStudentCode(value: string) {
  return value.trim().toUpperCase();
}

function mapPublicUser(user: UserWithRelations): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    class: user.class
      ? {
          id: user.class.id,
          code: user.class.code,
          name: user.class.name,
          grade: user.class.grade,
          academicYear: user.class.academicYear,
        }
      : null,
    studentProfile: user.studentProfile
      ? {
          studentCode: user.studentProfile.studentCode,
          grade: user.studentProfile.grade,
          avatarUrl: user.studentProfile.avatarUrl,
        }
      : null,
    teacherProfile: user.teacherProfile
      ? {
          employeeCode: user.teacherProfile.employeeCode,
          subject: user.teacherProfile.subject,
          avatarUrl: user.teacherProfile.avatarUrl,
        }
      : null,
    stats: user.stats ? {
      totalXp: user.stats.totalXp,
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
      lastStudyDate: user.stats.lastStudyDate,
    } : null,
  } as any; // Cast because PublicUser might need update for stats
}

async function createSession(
  user: UserWithRelations,
  context: AuthContext,
): Promise<TokenBundle> {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTtlDays = getRefreshTokenTtlDays();
  const expiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt,
    },
  });

  const accessToken = createAccessToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    sessionId: session.id,
  });

  return {
    accessToken,
    refreshToken,
    expiresInSeconds: getAccessTokenTtlSeconds(),
  };
}

export async function loginUnified(
  identifier: string,
  password: string,
  context: AuthContext,
) {
  const cleanId = identifier.trim();
  const normalizedUsername = normalizeUsername(cleanId);
  const normalizedStudentCode = normalizeStudentCode(cleanId);
  const normalizedEmail = cleanId.includes("@") ? normalizeEmail(cleanId) : "";

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: normalizedUsername },
        { email: normalizedEmail || undefined },
        { studentProfile: { studentCode: normalizedStudentCode } },
      ],
    },
    include: publicUserInclude,
  });

  if (!user) {
    throw new UnauthorizedError("Tài khoản không tồn tại.");
  }

  if (user.status !== "ACTIVE") {
    throw new UnauthorizedError("Tài khoản đã bị khóa hoặc chưa được kích hoạt.");
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Mật khẩu không chính xác.");
  }

  // Cập nhật thời gian đăng nhập cuối
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await createSession(user, context);

  return {
    user: mapPublicUser(user),
    tokens,
  };
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("Người dùng không tồn tại.");
  }

  const isPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new ValidationError("Mật khẩu cũ không chính xác.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  return { message: "Đổi mật khẩu thành công." };
}

export async function refreshAuthSession(
  refreshToken: string,
  context: AuthContext,
) {
  const refreshTokenHash = hashToken(refreshToken);

  const session = await prisma.authSession.findUnique({
    where: { refreshTokenHash },
    include: {
      user: {
        include: publicUserInclude,
      },
    },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    session.user.status !== "ACTIVE"
  ) {
    throw new UnauthorizedError("Phiên làm việc đã hết hạn hoặc không hợp lệ.");
  }

  // Rotate refresh token
  const nextRefreshToken = generateRefreshToken();
  const nextRefreshTokenHash = hashToken(nextRefreshToken);
  const nextExpiresAt = new Date(
    Date.now() + getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
  );

  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: nextRefreshTokenHash,
      expiresAt: nextExpiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    },
  });

  const accessToken = createAccessToken({
    userId: session.user.id,
    username: session.user.username,
    role: session.user.role,
    sessionId: session.id,
  });

  return {
    user: mapPublicUser(session.user),
    tokens: {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresInSeconds: getAccessTokenTtlSeconds(),
    },
  };
}

export async function logoutSession(sessionId: string) {
  await prisma.authSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  }).catch(() => {
    // Ignore if already revoked or not found
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: publicUserInclude,
  });

  if (!user) {
    throw new NotFoundError("Không tìm thấy thông tin người dùng.");
  }

  return mapPublicUser(user);
}

// Bổ sung các hàm provision cho Admin
export async function provisionUser(data: any) {
    // Giữ nguyên logic provision nếu cần, nhưng user yêu cầu admin tạo trước
    // Chúng ta sẽ giữ lại hoặc cập nhật sau nếu admin cần dùng API này
    // Ở đây tôi tạm để lại logic cũ đã được tối ưu
    const passwordHash = await hashPassword(data.password || "123456"); // Mặc định
    
    return prisma.user.create({
        data: {
            username: normalizeUsername(data.username),
            email: data.email ? normalizeEmail(data.email) : null,
            displayName: data.displayName,
            passwordHash,
            role: data.role,
            status: "ACTIVE",
            mustChangePassword: true,
            classId: data.classId,
            studentProfile: data.role === "STUDENT" ? {
                create: {
                    studentCode: normalizeStudentCode(data.studentCode),
                    grade: data.grade,
                }
            } : undefined,
            teacherProfile: data.role !== "STUDENT" ? {
                create: {
                    employeeCode: data.employeeCode,
                    subject: data.subject,
                }
            } : undefined,
            stats: data.role === "STUDENT" ? { create: {} } : undefined,
        },
        include: publicUserInclude
    });
}

// Hàm hỗ trợ tạo sẵn Admin và Teacher mặc định
export async function bootstrapDefaultAccounts() {
  const adminPasswordHash = await hashPassword("admin@123");
  const teacherPasswordHash = await hashPassword("teacher@123");

  // Kiểm tra Admin
  let admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: "admin",
        displayName: "Quản trị viên",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
        mustChangePassword: false,
        teacherProfile: {
          create: {
            employeeCode: "ADMIN001",
          }
        }
      }
    });
  }

  // Kiểm tra Teacher
  let teacher = await prisma.user.findUnique({ where: { username: "teacher" } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        username: "teacher",
        displayName: "Giáo viên mặc định",
        passwordHash: teacherPasswordHash,
        role: "TEACHER",
        status: "ACTIVE",
        mustChangePassword: false,
        teacherProfile: {
          create: {
            employeeCode: "GV001",
            subject: "KHTN",
          }
        }
      }
    });
  }

  return { message: "Tạo tài khoản mặc định thành công (admin/admin@123, teacher/teacher@123)." };
}
