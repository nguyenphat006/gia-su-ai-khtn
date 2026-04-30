import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClasses,
} from "../services/class.service.js";
import { ValidationError } from "../utils/errors.js";

/**
 * GET /api/classes — Lấy danh sách lớp
 */
export const listClasses = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, grade, academicYear } = req.query;

  const result = await getClasses({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    grade: grade ? Number(grade) : undefined,
    academicYear: academicYear as string,
  });

  res.json({ status: "ok", data: result });
});

/**
 * GET /api/classes/:id — Chi tiết lớp (kèm danh sách học sinh)
 */
export const getClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await getClassById(req.params.id);
  res.json({ status: "ok", data: { class: cls } });
});

/**
 * POST /api/classes — Tạo lớp mới
 */
export const createNewClass = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, grade, academicYear } = req.body;

  if (!code || !name || !grade || !academicYear) {
    throw new ValidationError("Thiếu dữ liệu bắt buộc: code, name, grade, academicYear.");
  }

  const cls = await createClass({ code, name, grade: Number(grade), academicYear });
  res.status(201).json({ status: "ok", data: { class: cls } });
});

/**
 * PUT /api/classes/:id — Cập nhật lớp
 */
export const updateExistingClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await updateClass(req.params.id, req.body);
  res.json({ status: "ok", data: { class: cls } });
});

/**
 * DELETE /api/classes — Xóa nhiều lớp học
 */
export const removeClasses = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Danh sách ID không hợp lệ.");
  }
  const result = await deleteClasses(ids);
  res.json({ status: "ok", data: result });
});
