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
import { Role } from "@prisma/client";
import { ValidationError, UnauthorizedError } from "../utils/errors.js";

// ========================
// USER LIST / CRUD (Admin)
// ========================

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const classId = req.query.classId as string;
  const status = req.query.status as string;

  const result = await getUsers({
    page,
    limit,
    search,
    role: role as any,
    classId,
    status: status as any,
  });

  res.json({ status: "ok", data: result });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUserById(id);
  res.json({ status: "ok", data: { user } });
});

export const createNewUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const user = await createUser(data);
  res.status(201).json({ status: "ok", data: { user } });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const user = await updateUserByAdmin(id, data);
  res.json({ status: "ok", data: { user } });
});

export const removeUsers = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Vui long cung cap danh sach ID.");
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
  const { users, seedActivity, seedOptions } = req.body;
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

  const result = await batchImportUsers(normalized, isSeeding, seedOptions);
  res.json({ status: "ok", data: result });
});

/**
 * POST /api/users/import-excel — Upload file Excel de import hoc sinh
 */
export const importUsersFromExcel = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError("Vui long tai len file Excel (.xlsx).");
  }

  const { seedActivity, grade, classId: targetClassId, seedOptions: rawSeedOptions } = req.body;
  const isSeeding = seedActivity === "true" || seedActivity === true;
  
  let seedOptions: any = undefined;
  if (rawSeedOptions) {
    try {
      seedOptions = typeof rawSeedOptions === 'string' ? JSON.parse(rawSeedOptions) : rawSeedOptions;
    } catch (e) {
      console.error("Lỗi parse seedOptions:", e);
    }
  }

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

  const result = await batchImportUsers(usersToImport, isSeeding, seedOptions);
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
        email: "binh.tv@school.edu.vn",
      }
    ];
  } else {
    const result = await getUsers({
      page: 1,
      limit: 10000,
      search: search as string,
      role: role as any,
      classId: classId as string,
    });
    exportData = result.users.map(u => ({
      "Tên đăng nhập": u.username,
      "Họ và tên": u.displayName,
      "Vai trò": u.role,
      "Trạng thái": u.status,
      "Khối": u.studentProfile?.grade || u.teacherProfile?.subject || "",
      "Mã số": u.studentProfile?.studentCode || u.teacherProfile?.employeeCode || "",
      "Email": u.email || "",
      "Lớp": u.class?.name || "",
      "Ngày tạo": new Date(u.createdAt).toLocaleDateString(),
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  // Neu la template, them huong dan
  if (isTemplate) {
    const guideData = [
      { "Ten cot": "username", "Bat buoc": "X", "Mo ta": "Ten dang nhap duy nhat", "Vi du": "nguyenvana" },
      { "Ten cot": "displayName", "Bat buoc": "X", "Mo ta": "Ho va ten hien thi", "Vi du": "Nguyen Van An" },
      { "Ten cot": "password", "Bat buoc": "", "Mo ta": "Mat khau (mac dinh 123456)", "Vi du": "123456" },
      { "Ten cot": "role", "Bat buoc": "", "Mo ta": "STUDENT, TEACHER, ADMIN", "Vi du": "STUDENT" },
      { "Ten cot": "studentCode", "Bat buoc": "", "Mo ta": "Ma hoc sinh (cho STUDENT)", "Vi du": "HS2024001" },
      { "Ten cot": "grade", "Bat buoc": "", "Mo ta": "Khoi lop 6/7/8/9", "Vi du": "6" },
      { "Ten cot": "classId", "Bat buoc": "", "Mo ta": "ID lop trong he thong", "Vi du": "..." },
      { "Ten cot": "email", "Bat buoc": "", "Mo ta": "Email lien he", "Vi du": "hs@truong.edu.vn" },
    ];
    const wsGuide = XLSX.utils.json_to_sheet(guideData);
    wsGuide["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 45 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, "Huong dan");
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

/**
 * POST /api/users/generate-mock — Tao du lieu hoc sinh gia lap bang AI
 */
export const generateMockData = asyncHandler(async (req: Request, res: Response) => {
  const { count, classId, grade, saveToDb, seedActivity, seedOptions } = req.body;
  const isSeeding = seedActivity === "true" || seedActivity === true;

  const num = Number(count);
  if (!count || isNaN(num) || num < 1 || num > 50) {
    throw new ValidationError("So luong (count) phai tu 1 den 50.");
  }

  const users = await generateMockUsers(num, classId as string, grade ? Number(grade) : undefined);

  if (saveToDb === true) {
    const result = await batchImportUsers(users, isSeeding, seedOptions);
    return res.json({ status: "ok", data: { users, saved: result } });
  }

  res.json({ status: "ok", data: { users } });
});
