import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

// ========================
// QUERY HELPERS
// ========================

const classInclude = {
  _count: { select: { users: true } },
} satisfies Prisma.ClassInclude;

interface ListClassesQuery {
  page?: number;
  limit?: number;
  search?: string;
  grade?: number;
  academicYear?: string;
}

// ========================
// CRUD OPERATIONS
// ========================

/**
 * Lấy danh sách lớp học (phân trang, tìm kiếm, lọc)
 */
export async function getClasses(query: ListClassesQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.ClassWhereInput = {};

  if (query.grade) {
    where.grade = query.grade;
  }

  if (query.academicYear) {
    where.academicYear = query.academicYear;
  }

  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      include: classInclude,
      skip,
      take: limit,
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.class.count({ where }),
  ]);

  return {
    classes: classes.map((c) => ({
      ...c,
      studentCount: c._count.users,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Lấy chi tiết một lớp (bao gồm danh sách học sinh)
 */
export async function getClassById(id: string) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          studentProfile: { select: { studentCode: true, grade: true, avatarUrl: true } },
        },
        orderBy: { displayName: "asc" },
      },
      _count: { select: { users: true } },
    },
  });

  if (!cls) {
    throw new NotFoundError("Không tìm thấy lớp học.");
  }

  return { ...cls, studentCount: cls._count.users, _count: undefined };
}

/**
 * Tạo lớp học mới
 */
export async function createClass(data: {
  code: string;
  name: string;
  grade: number;
  academicYear: string;
}) {
  if (!data.code?.trim()) {
    throw new ValidationError("Mã lớp là bắt buộc.");
  }
  if (!data.name?.trim()) {
    throw new ValidationError("Tên lớp là bắt buộc.");
  }
  if (!data.grade || data.grade < 6 || data.grade > 9) {
    throw new ValidationError("Khối lớp phải từ 6 đến 9.");
  }
  if (!data.academicYear?.trim()) {
    throw new ValidationError("Năm học là bắt buộc (VD: 2024-2025).");
  }

  const code = data.code.trim().toUpperCase();
  const name = data.name.trim();

  // Kiểm tra trùng mã lớp
  const existingCode = await prisma.class.findUnique({ where: { code } });
  if (existingCode) {
    throw new ConflictError("Mã lớp đã tồn tại.");
  }

  // Kiểm tra trùng tên + năm học
  const existingName = await prisma.class.findUnique({
    where: { name_academicYear: { name, academicYear: data.academicYear.trim() } },
  });
  if (existingName) {
    throw new ConflictError("Tên lớp đã tồn tại trong năm học này.");
  }

  const cls = await prisma.class.create({
    data: {
      code,
      name,
      grade: data.grade,
      academicYear: data.academicYear.trim(),
    },
    include: classInclude,
  });

  return { ...cls, studentCount: cls._count.users, _count: undefined };
}

/**
 * Cập nhật thông tin lớp học
 */
export async function updateClass(id: string, data: {
  code?: string;
  name?: string;
  grade?: number;
  academicYear?: string;
}) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Không tìm thấy lớp học.");
  }

  // Kiểm tra trùng mã lớp nếu đổi
  if (data.code !== undefined) {
    const code = data.code.trim().toUpperCase();
    const dup = await prisma.class.findFirst({ where: { code, NOT: { id } } });
    if (dup) {
      throw new ConflictError("Mã lớp đã tồn tại.");
    }
  }

  // Validate grade
  if (data.grade !== undefined && (data.grade < 6 || data.grade > 9)) {
    throw new ValidationError("Khối lớp phải từ 6 đến 9.");
  }

  const cls = await prisma.class.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.grade !== undefined && { grade: data.grade }),
      ...(data.academicYear !== undefined && { academicYear: data.academicYear.trim() }),
    },
    include: classInclude,
  });

  return { ...cls, studentCount: cls._count.users, _count: undefined };
}

/**
 * Xóa nhiều lớp học (chỉ xóa được khi không còn học sinh)
 */
export async function deleteClasses(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Danh sách ID không hợp lệ.");
  }

  const classes = await prisma.class.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { users: true } } },
  });

  if (classes.length === 0) {
    throw new NotFoundError("Không tìm thấy lớp học nào để xoá.");
  }

  const classesWithStudents = classes.filter(c => c._count.users > 0);
  if (classesWithStudents.length > 0) {
    const names = classesWithStudents.map(c => c.name).join(", ");
    throw new ValidationError(
      `Không thể xóa các lớp: ${names} vì vẫn còn học sinh. Hãy chuyển học sinh sang lớp khác trước.`
    );
  }

  const result = await prisma.class.deleteMany({ where: { id: { in: ids } } });

  return { message: `Xóa thành công ${result.count} lớp học.` };
}
