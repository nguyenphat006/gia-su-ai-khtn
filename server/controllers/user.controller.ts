import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import * as XLSX from "xlsx";
import {
  getUsers,
  getUserById,
  createUser,
  updateUserByAdmin,
  deleteUsers,
  updateMyProfile,
  batchImportUsers,
} from "../services/user.service.js";
import { generateMockUsers } from "../services/gemini.service.js";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";
import { Role } from "@prisma/client";

// ========================
// CRUD (Admin only)
// ========================

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

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id);
  res.json({ status: "ok", data: { user } });
});

export const createNewUser = asyncHandler(async (req: Request, res: Response) => {
  const { role, username, displayName, password, email, classId, studentCode, grade, employeeCode, subject } = req.body;

  if (!role || !username || !displayName) {
    throw new ValidationError("Thieu du lieu bat buoc: role, username, displayName.");
  }

  if (!Object.values(Role).includes(role)) {
    throw new ValidationError("Vai tro khong hop le (STUDENT, TEACHER, ADMIN).");
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

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUserByAdmin(req.params.id, req.body);
  res.json({ status: "ok", data: { user } });
});

export const removeUsers = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Danh sach ID khong hop le.");
  }
  const result = await deleteUsers(ids);
  res.json({ status: "ok", data: result });
});

// ========================
// PROFILE UPDATE (Self)
// ========================

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new UnauthorizedError("Yeu cau xac thuc.");
  }

  const { displayName, avatarUrl } = req.body;
  const user = await updateMyProfile(userId, { displayName, avatarUrl });
  res.json({ status: "ok", data: { user } });
});

// ========================
// IMPORT / EXPORT / GENERATE (Admin)
// ========================

/**
 * POST /api/users/batch-import — Import tu JSON array (AI generate preview -> save)
 */
export const importUsersFromJson = asyncHandler(async (req: Request, res: Response) => {
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    throw new ValidationError("Du lieu khong hop le. Can truong 'users' la mang.");
  }

  const normalized = users.map((u: any) => ({
    username: String(u.username || "").trim(),
    displayName: String(u.displayName || "").trim(),
    password: String(u.password || "123456").trim(),
    email: u.email ? String(u.email).trim() : undefined,
    studentCode: u.studentCode ? String(u.studentCode).trim() : undefined,
    grade: u.grade ? Number(u.grade) : undefined,
    classId: u.classId ? String(u.classId).trim() : undefined,
    role: (u.role || "STUDENT") as Role,
  })).filter((u) => u.username && u.displayName);

  if (normalized.length === 0) {
    throw new ValidationError("Khong co du lieu hop le (can username va displayName).");
  }

  const result = await batchImportUsers(normalized);
  res.json({ status: "ok", data: result });
});

/**
 * POST /api/users/import-excel — Upload file Excel de import hoc sinh
 */
export const importUsersFromExcel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError("Vui long tai len file Excel (.xlsx).");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  } catch {
    throw new ValidationError("File khong dung dinh dang Excel (.xlsx).");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    throw new ValidationError("File Excel khong co du lieu.");
  }

  // Normalize header mapping (ho tro ca tieng Anh va tieng Viet)
  const usersToImport = rows.map((row) => ({
    username: String(row["username"] || row["Ten dang nhap"] || "").trim(),
    displayName: String(row["displayName"] || row["Ho va ten"] || "").trim(),
    password: String(row["password"] || row["Mat khau"] || "123456").trim(),
    email: String(row["email"] || row["Email"] || "").trim() || undefined,
    studentCode: String(row["studentCode"] || row["Ma hoc sinh"] || "").trim() || undefined,
    grade: row["grade"] || row["Khoi lop"] || undefined,
    classId: String(row["classId"] || row["Ma lop"] || "").trim() || undefined,
    role: String(row["role"] || row["Vai tro"] || "STUDENT").trim().toUpperCase() as Role,
  })).filter((u) => u.username && u.displayName);

  if (usersToImport.length === 0) {
    throw new ValidationError(
      "Khong tim thay du lieu hop le. File can co cot 'username' va 'displayName'."
    );
  }

  const result = await batchImportUsers(usersToImport);
  res.json({ status: "ok", data: { ...result, total: rows.length } });
});

/**
 * GET /api/users/export-excel — Xuat danh sach user ra file Excel
 */
export const exportUsersToExcel = asyncHandler(async (req: Request, res: Response) => {
  const { role, classId, search } = req.query;

  const result = await getUsers({
    limit: 1000,
    role: role as Role,
    classId: classId as string,
    search: search as string,
  });

  const exportData = result.users.map((u: any, index: number) => ({
    STT: index + 1,
    "Ho va ten": u.displayName,
    "Ten dang nhap": u.username,
    "Vai tro": u.role,
    Email: u.email || "",
    "Trang thai": u.status,
    Lop: u.class?.name || "",
    "Ma hoc sinh": u.studentProfile?.studentCode || "",
    "Khoi lop": u.studentProfile?.grade || "",
    "Ma nhan vien": u.teacherProfile?.employeeCode || "",
    "Ngay tao": u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  ws["!cols"] = [
    { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
    { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Danh sach nguoi dung");

  // Sheet huong dan import
  const guideData = [
    { "Ten cot (bat buoc)": "username", "Mo ta": "Ten dang nhap (khong dau, khong khoang trang)", "Vi du": "nguyenvana" },
    { "Ten cot (bat buoc)": "displayName", "Mo ta": "Ho va ten day du", "Vi du": "Nguyen Van A" },
    { "Ten cot (bat buoc)": "password", "Mo ta": "Mat khau (mac dinh 123456)", "Vi du": "HS@2024" },
    { "Ten cot (bat buoc)": "role", "Mo ta": "Vai tro (mac dinh STUDENT)", "Vi du": "STUDENT / TEACHER / ADMIN" },
    { "Ten cot (bat buoc)": "studentCode", "Mo ta": "Ma hoc sinh (tuy chon)", "Vi du": "20241001" },
    { "Ten cot (bat buoc)": "grade", "Mo ta": "Khoi lop 6/7/8/9 (tuy chon)", "Vi du": "7" },
    { "Ten cot (bat buoc)": "classId", "Mo ta": "ID lop hoc trong he thong (tuy chon)", "Vi du": "uuid-cua-lop" },
    { "Ten cot (bat buoc)": "email", "Mo ta": "Email (tuy chon)", "Vi du": "hs@truong.edu.vn" },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide["!cols"] = [{ wch: 20 }, { wch: 45 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Huong dan Import");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

/**
 * POST /api/users/generate-mock — Tao du lieu hoc sinh gia lap bang AI
 */
export const generateMockData = asyncHandler(async (req: Request, res: Response) => {
  const { count, classId, grade, saveToDb } = req.body;

  const num = Number(count);
  if (!count || isNaN(num) || num < 1 || num > 50) {
    throw new ValidationError("So luong (count) phai tu 1 den 50.");
  }

  const users = await generateMockUsers(num, classId as string, grade ? Number(grade) : undefined);

  if (saveToDb === true) {
    const result = await batchImportUsers(users);
    return res.json({ status: "ok", data: { users, saved: result } });
  }

  res.json({ status: "ok", data: { users } });
});
