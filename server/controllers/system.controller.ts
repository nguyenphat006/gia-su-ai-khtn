import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/error-handler.js";
import {
  getAllSystemConfigs,
  getSystemConfig,
  upsertSystemConfig,
  createSystemConfig,
  deleteSystemConfigs,
} from "../services/system.service.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

/**
 * GET /api/system/configs — Lấy danh sách cấu hình hệ thống
 */
export const listConfigs = asyncHandler(async (req: Request, res: Response) => {
  const result = await getAllSystemConfigs();
  res.json({ status: "ok", data: result });
});

/**
 * GET /api/system/configs/:key — Lấy chi tiết một cấu hình
 */
export const getConfig = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  
  if (!config) {
    throw new NotFoundError("Không tìm thấy cấu hình hệ thống.");
  }

  res.json({ status: "ok", data: { config } });
});

/**
 * POST /api/system/configs — Thêm cấu hình mới
 */
export const addConfig = asyncHandler(async (req: Request, res: Response) => {
  const { key, value } = req.body;
  const userId = req.auth?.userId || "system";

  if (!key || !value) {
    throw new ValidationError("Khóa và giá trị cấu hình là bắt buộc.");
  }

  const config = await createSystemConfig(key, value, userId);

  res.status(201).json({ status: "ok", data: { config } });
});

/**
 * PUT /api/system/configs/:key — Cập nhật cấu hình hệ thống
 */
export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;
  const userId = req.auth?.userId || "system";

  if (value === undefined) {
    throw new ValidationError("Giá trị cấu hình là bắt buộc.");
  }

  const config = await upsertSystemConfig(key, value, userId);

  res.json({ status: "ok", data: { config } });
});

/**
 * DELETE /api/system/configs — Xóa nhiều cấu hình hệ thống (bulk)
 */
export const removeConfigs = asyncHandler(async (req: Request, res: Response) => {
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new ValidationError("Danh sách keys không hợp lệ.");
  }
  const result = await deleteSystemConfigs(keys);
  
  res.json({ status: "ok", data: result });
});
