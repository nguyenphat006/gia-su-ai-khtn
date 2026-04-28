import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUserByAdmin,
  deleteUser,
  updateMyProfile,
} from "../services/user.service.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";
import { Role } from "@prisma/client";

// ========================
// CRUD (Admin only)
// ========================

/**
 * GET /api/users — Lấy danh sách user
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, role, status, classId } = req.query;

  const result = await getUsers({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    role: role as Role,
    status: status as string,
    classId: classId as string,
  });

  res.json({ status: "ok", data: result });
});

/**
 * GET /api/users/:id — Lấy chi tiết một user
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id);
  res.json({ status: "ok", data: { user } });
});

/**
 * POST /api/users — Tạo user mới
 */
export const createNewUser = asyncHandler(async (req: Request, res: Response) => {
  const { role, username, displayName, password, email, classId, studentCode, grade, employeeCode, subject } = req.body;

  if (!role || !username || !displayName) {
    throw new ValidationError("Thiếu dữ liệu bắt buộc: role, username, displayName.");
  }

  if (!Object.values(Role).includes(role)) {
    throw new ValidationError("Vai trò không hợp lệ (STUDENT, TEACHER, ADMIN).");
  }

  const user = await createUser({
    role,
    username,
    displayName,
    password,
    email,
    classId,
    studentCode,
    grade: grade ? Number(grade) : undefined,
    employeeCode,
    subject,
  });

  res.status(201).json({ status: "ok", data: { user } });
});

/**
 * PUT /api/users/:id — Admin cập nhật user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUserByAdmin(req.params.id, req.body);
  res.json({ status: "ok", data: { user } });
});

/**
 * DELETE /api/users/:id — Admin xóa user
 */
export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteUser(req.params.id);
  res.json({ status: "ok", data: result });
});

// ========================
// PROFILE UPDATE (Self)
// ========================

/**
 * PUT /api/users/me — Người dùng tự cập nhật hồ sơ
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new UnauthorizedError("Yêu cầu xác thực.");
  }

  const { displayName, avatarUrl } = req.body;

  const user = await updateMyProfile(userId, { displayName, avatarUrl });
  res.json({ status: "ok", data: { user } });
});
