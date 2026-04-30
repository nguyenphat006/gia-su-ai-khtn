import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import {
  createKnowledgeDocument,
  deleteKnowledgeDocuments,
  getKnowledgeDocuments,
  updateKnowledgeDocument,
} from "../services/knowledge.service.js";
import { ValidationError } from "../utils/errors.js";

/**
 * GET /api/knowledge — Lấy danh sách tài liệu tri thức
 */
export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, active } = req.query;

  const result = await getKnowledgeDocuments({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    onlyActive: active === "true",
  });

  res.json({ status: "ok", data: result });
});

/**
 * POST /api/knowledge — Thêm tài liệu mới
 */
export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, tags, isActive } = req.body;

  if (!title || !content) {
    throw new ValidationError("Tiêu đề và nội dung là bắt buộc.");
  }

  const document = await createKnowledgeDocument({ title, content, tags, isActive });

  res.status(201).json({
    status: "ok",
    data: { document },
  });
});

/**
 * PUT /api/knowledge/:id — Cập nhật tài liệu
 */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, tags, isActive } = req.body;

  const document = await updateKnowledgeDocument(id, { title, content, tags, isActive });

  res.json({
    status: "ok",
    data: { document },
  });
});

/**
 * DELETE /api/knowledge — Xóa nhiều tài liệu (bulk)
 */
export const removeDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Danh sách IDs không hợp lệ.");
  }
  const result = await deleteKnowledgeDocuments(ids);
  res.json({ status: "ok", data: result });
});
