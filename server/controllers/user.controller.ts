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
import { ValidationError, UnauthorizedError, NotFoundError } from "../utils/errors.js";
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
  const { users, seedActivity } = req.body;
  const isSeeding = seedActivity === "true" || seedActivity === true;

  if (!Array.isArray(users) || users.length === 0) {
    throw new ValidationError("Du lieu khong hop le. Can truong 'users' la mang.");
  }

  const normalized = users.map((u: any) => {
    const rawPassword = u.password !== undefined && u.password !== null ? String(u.password).trim() : "";
    return {
      username: String(u.username || "").trim(),
      displayName: String(u.displayName || "").trim(),
      password: rawPassword || "123456",
      email: u.email ? String(u.email).trim() : undefined,
      studentCode: u.studentCode ? String(u.studentCode).trim() : undefined,
      grade: u.grade ? Number(u.grade) : undefined,
      classId: u.classId ? String(u.classId).trim() : undefined,
      role: (u.role || "STUDENT") as Role,
    };
  }).filter((u) => u.username && u.displayName);

  if (normalized.length === 0) {
    throw new ValidationError("Khong co du lieu hop le (can username va displayName).");
  }

  const result = await batchImportUsers(normalized, isSeeding);
  res.json({ status: "ok", data: result });
});

/**
 * POST /api/users/import-excel — Upload file Excel de import hoc sinh
 */
export const importUsersFromExcel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError("Vui long tai len file Excel (.xlsx).");
  }

  const { seedActivity, grade, classId: targetClassId } = req.body;
  const isSeeding = seedActivity === "true" || seedActivity === true;

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  } catch {
    throw new ValidationError("File khong dung dinh dang Excel (.xlsx).");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Doc du lieu: neu khong co header thi dung header: 1 de lay mang cac mang
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rows.length === 0) {
    throw new ValidationError("File Excel khong co du lieu.");
  }

  // logic thong minh: 
  // 1. Neu row 1 chi co 1 cot hoac cac header khong khop 'username'/'displayName'
  // -> Coi nhu day la file chi co ten hoc sinh
  const firstRow = rows[0];
  const hasStandardHeader = firstRow["username"] || firstRow["Ten dang nhap"] || firstRow["displayName"] || firstRow["Ho va ten"];

  let usersToImport: any[] = [];

  if (!hasStandardHeader) {
    // Truong hop 1: File chi co danh sach ten (moi dong la 1 ten)
    // Dung rawRows de dam bao lay dung gia tri o cot dau tien cho moi hang
    const { generateUsername } = await import("../services/user.service.js");
    
    usersToImport = rawRows
      .map((row) => {
        const name = String(row[0] || "").trim();
        if (!name) return null;
        return {
          username: generateUsername(name),
          displayName: name,
          password: "123456",
          grade: grade ? Number(grade) : 6, // Mac dinh khoi 6 neu ko chon
          classId: targetClassId || undefined,
          role: "STUDENT" as Role,
        };
      })
      .filter(Boolean);
  } else {
    // Truong hop 2: File co header tieu chuan
    usersToImport = rows.map((row) => {
      const rawUsername = String(row["username"] || row["Ten dang nhap"] || "").trim();
      const rawDisplayName = String(row["displayName"] || row["Ho va ten"] || "").trim();
      const rawPassword = String(row["password"] || row["Mat khau"] || "").trim();

      return {
        username: rawUsername,
        displayName: rawDisplayName,
        password: rawPassword || "123456",
        email: String(row["email"] || row["Email"] || "").trim() || undefined,
        studentCode: String(row["studentCode"] || row["Ma hoc sinh"] || "").trim() || undefined,
        grade: row["grade"] || row["Khoi lop"] || grade || undefined,
        classId: String(row["classId"] || row["Ma lop"] || targetClassId || "").trim() || undefined,
        role: String(row["role"] || row["Vai tro"] || "STUDENT").trim().toUpperCase() as Role,
      };
    }).filter((u) => u.username && u.displayName);
  }

  if (usersToImport.length === 0) {
    throw new ValidationError(
      "Khong tim thay du lieu hop le. File can co danh sach ten hoac cot 'username' va 'displayName'."
    );
  }

  const result = await batchImportUsers(usersToImport, isSeeding);
  res.json({ status: "ok", data: { ...result, total: usersToImport.length } });
});

/**
 * GET /api/users/export-excel — Xuat danh sach user ra file Excel hoac Tai file mau
 */
export const exportUsersToExcel = asyncHandler(async (req: Request, res: Response) => {
  const { role, classId, search, template } = req.query;

  const isTemplate = template === "true";
  let exportData: any[] = [];
  let filename = `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (isTemplate) {
    filename = `mau_import_nguoi_dung.xlsx`;
    exportData = [
      {
        username: "nguyenvana",
        displayName: "Nguyễn Văn An",
        password: "Mật khẩu (để trống là 123456)",
        role: "STUDENT",
        studentCode: "HS2024001",
        grade: 6,
        classId: "ID_LỚP_NẾU_CÓ",
        email: "an.nv@school.edu.vn",
      },
      {
        username: "tranvanb",
        displayName: "Trần Văn Bình",
        password: "123456",
        role: "STUDENT",
        studentCode: "HS2024002",
        grade: 7,
        classId: "",
        email: "",
      }
    ];
  } else {
    const result = await getUsers({
      limit: 1000,
      role: role as Role,
      classId: classId as string,
      search: search as string,
    });

    exportData = result.users.map((u: any, index: number) => ({
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
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  if (isTemplate) {
    ws["!cols"] = [
      { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 25 }
    ];
  } else {
    ws["!cols"] = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
      { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
    ];
  }

  XLSX.utils.book_append_sheet(wb, ws, isTemplate ? "Mau Import" : "Danh sach nguoi dung");

  // Sheet huong dan import
  const guideData = [
    { "Ten cot": "username", "Bat buoc": "X", "Mo ta": "Ten dang nhap (viet lien, khong dau)", "Vi du": "nguyenvana" },
    { "Ten cot": "displayName", "Bat buoc": "X", "Mo ta": "Ho va ten day du", "Vi du": "Nguyen Van A" },
    { "Ten cot": "password", "Bat buoc": "", "Mo ta": "Mat khau (mac dinh 123456)", "Vi du": "123456" },
    { "Ten cot": "role", "Bat buoc": "", "Mo ta": "Vai tro: STUDENT / TEACHER / ADMIN", "Vi du": "STUDENT" },
    { "Ten cot": "studentCode", "Bat buoc": "", "Mo ta": "Ma hoc sinh (cho STUDENT)", "Vi du": "HS2024001" },
    { "Ten cot": "grade", "Bat buoc": "", "Mo ta": "Khoi lop 6/7/8/9", "Vi du": "6" },
    { "Ten cot": "classId", "Bat buoc": "", "Mo ta": "ID lop trong he thong", "Vi du": "..." },
    { "Ten cot": "email", "Bat buoc": "", "Mo ta": "Email lien he", "Vi du": "hs@truong.edu.vn" },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Huong dan");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

/**
 * POST /api/users/generate-mock — Tao du lieu hoc sinh gia lap bang AI
 */
export const generateMockData = asyncHandler(async (req: Request, res: Response) => {
  const { count, classId, grade, saveToDb, seedActivity } = req.body;
  const isSeeding = seedActivity === "true" || seedActivity === true;

  const num = Number(count);
  if (!count || isNaN(num) || num < 1 || num > 50) {
    throw new ValidationError("So luong (count) phai tu 1 den 50.");
  }

  const users = await generateMockUsers(num, classId as string, grade ? Number(grade) : undefined);

  if (saveToDb === true) {
    const result = await batchImportUsers(users, isSeeding);
    return res.json({ status: "ok", data: { users, saved: result } });
  }

  res.json({ status: "ok", data: { users } });
});
