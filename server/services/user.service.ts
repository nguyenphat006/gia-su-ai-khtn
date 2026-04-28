import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { hashPassword } from "../utils/password.js";

// ========================
// INCLUDES & TYPES
// ========================

const userInclude = {
  class: true,
  studentProfile: true,
  teacherProfile: true,
  stats: true,
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

function stripPassword(user: UserWithRelations) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ========================
// QUERY HELPERS
// ========================

interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  status?: string;
  classId?: string;
}

// ========================
// CRUD OPERATIONS (Admin)
// ========================

/**
 * Lấy danh sách người dùng (có phân trang, tìm kiếm, lọc)
 */
export async function getUsers(query: ListUsersQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  // Lọc theo role
  if (query.role) {
    where.role = query.role;
  }

  // Lọc theo status
  if (query.status) {
    where.status = query.status as any;
  }

  // Lọc theo lớp
  if (query.classId) {
    where.classId = query.classId;
  }

  // Tìm kiếm theo tên, username, email hoặc mã học sinh
  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { studentProfile: { studentCode: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(stripPassword),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Lấy thông tin chi tiết một người dùng theo ID
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });

  if (!user) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  return stripPassword(user);
}

/**
 * Admin tạo user mới (Student / Teacher / Admin)
 */
export async function createUser(data: {
  role: Role;
  username: string;
  displayName: string;
  password?: string;
  email?: string;
  classId?: string;
  // Student fields
  studentCode?: string;
  grade?: number;
  // Teacher fields
  employeeCode?: string;
  subject?: string;
}) {
  const username = data.username.trim().toLowerCase().replace(/\s+/g, "");
  if (!username) {
    throw new ValidationError("Tên đăng nhập là bắt buộc.");
  }

  // Kiểm tra trùng username
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    throw new ConflictError("Tên đăng nhập đã tồn tại.");
  }

  // Kiểm tra trùng email
  const email = data.email?.trim().toLowerCase() || null;
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictError("Email đã được sử dụng.");
    }
  }

  // Kiểm tra trùng mã học sinh
  if (data.studentCode) {
    const code = data.studentCode.trim().toUpperCase();
    const existingCode = await prisma.studentProfile.findUnique({ where: { studentCode: code } });
    if (existingCode) {
      throw new ConflictError("Mã học sinh đã tồn tại.");
    }
  }

  // Validation theo role
  if (data.role === "STUDENT") {
    if (!data.studentCode) {
      throw new ValidationError("Mã học sinh là bắt buộc.");
    }
    if (!data.grade || data.grade < 6 || data.grade > 9) {
      throw new ValidationError("Khối lớp phải từ 6 đến 9.");
    }
  }

  // Kiểm tra classId hợp lệ
  if (data.classId) {
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls) {
      throw new NotFoundError("Không tìm thấy lớp học.");
    }
  }

  const passwordHash = await hashPassword(data.password || "123456abc");

  const user = await prisma.user.create({
    data: {
      username,
      email,
      displayName: data.displayName.trim(),
      passwordHash,
      role: data.role,
      status: "ACTIVE",
      mustChangePassword: true,
      classId: data.classId || null,
      studentProfile: data.role === "STUDENT" ? {
        create: {
          studentCode: data.studentCode!.trim().toUpperCase(),
          grade: data.grade!,
        }
      } : undefined,
      teacherProfile: data.role !== "STUDENT" ? {
        create: {
          employeeCode: data.employeeCode?.trim() || null,
          subject: data.subject?.trim() || null,
        }
      } : undefined,
      stats: data.role === "STUDENT" ? { create: {} } : undefined,
    },
    include: userInclude,
  });

  return stripPassword(user);
}

/**
 * Admin cập nhật thông tin user
 */
export async function updateUserByAdmin(id: string, data: {
  displayName?: string;
  email?: string;
  role?: Role;
  status?: string;
  classId?: string | null;
  // Student fields
  studentCode?: string;
  grade?: number;
  // Teacher fields
  employeeCode?: string;
  subject?: string;
  // Reset password
  password?: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });

  if (!existingUser) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  // Kiểm tra trùng email nếu đổi
  if (data.email !== undefined) {
    const email = data.email?.trim().toLowerCase() || null;
    if (email) {
      const dup = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (dup) {
        throw new ConflictError("Email đã được sử dụng.");
      }
    }
  }

  // Chuẩn bị dữ liệu update cho User
  const userUpdate: Prisma.UserUpdateInput = {};
  if (data.displayName !== undefined) userUpdate.displayName = data.displayName.trim();
  if (data.email !== undefined) userUpdate.email = data.email?.trim().toLowerCase() || null;
  if (data.role !== undefined) userUpdate.role = data.role;
  if (data.status !== undefined) userUpdate.status = data.status as any;
  if (data.classId !== undefined) {
    userUpdate.class = data.classId
      ? { connect: { id: data.classId } }
      : { disconnect: true };
  }
  if (data.password) {
    userUpdate.passwordHash = await hashPassword(data.password);
    userUpdate.mustChangePassword = true;
  }

  // Update Student Profile
  if (existingUser.studentProfile && (data.studentCode || data.grade)) {
    await prisma.studentProfile.update({
      where: { userId: id },
      data: {
        ...(data.studentCode && { studentCode: data.studentCode.trim().toUpperCase() }),
        ...(data.grade && { grade: data.grade }),
      },
    });
  }

  // Update Teacher Profile
  if (existingUser.teacherProfile && (data.employeeCode !== undefined || data.subject !== undefined)) {
    await prisma.teacherProfile.update({
      where: { userId: id },
      data: {
        ...(data.employeeCode !== undefined && { employeeCode: data.employeeCode?.trim() || null }),
        ...(data.subject !== undefined && { subject: data.subject?.trim() || null }),
      },
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: userUpdate,
    include: userInclude,
  });

  return stripPassword(updatedUser);
}

/**
 * Admin xóa user (Hard delete — cascade sẽ xóa profile, sessions, stats, xpLogs)
 */
export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  await prisma.user.delete({ where: { id } });

  return { message: "Xóa người dùng thành công." };
}

// ========================
// PROFILE UPDATE (Self)
// ========================

/**
 * Người dùng tự cập nhật hồ sơ cá nhân
 */
export async function updateMyProfile(userId: string, data: {
  displayName?: string;
  avatarUrl?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!user) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  // Update displayName trên bảng User
  if (data.displayName !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName.trim() },
    });
  }

  // Update avatarUrl trên profile tương ứng
  if (data.avatarUrl !== undefined) {
    if (user.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId },
        data: { avatarUrl: data.avatarUrl },
      });
    } else if (user.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { userId },
        data: { avatarUrl: data.avatarUrl },
      });
    }
  }

  // Trả về user đã cập nhật
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  return stripPassword(updatedUser!);
}
