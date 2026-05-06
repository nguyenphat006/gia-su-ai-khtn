import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { processDocumentUpload, getSourceDocuments, reviewPendingQuestions } from "../services/document.service.js";

/**
 * Upload tệp tài liệu để phân tích ngầm
 * Yêu cầu: Multipart/form-data với field 'file'
 */
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "Vui lòng chọn tệp tài liệu (PDF, DOCX, TXT)." });
  }

  const { grade, topic } = req.body;

  const document = await processDocumentUpload(
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname,
    grade ? parseInt(grade) : undefined,
    topic
  );

  res.status(202).json({
    status: "ok",
    message: "Đã tiếp nhận tài liệu. Hệ thống đang tiến hành đọc và sinh câu hỏi (Quá trình này có thể mất vài phút).",
    data: { document }
  });
});

/**
 * Lấy danh sách các tài liệu đã tải lên và trạng thái tiến độ
 */
export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const documents = await getSourceDocuments();
  res.json({ status: "ok", data: { documents } });
});

/**
 * Duyệt hoặc xóa các câu hỏi đang pending của một tài liệu
 */
export const reviewDocumentQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // "APPROVE_ALL" hoặc "DELETE_ALL"

  if (action !== "APPROVE_ALL" && action !== "DELETE_ALL") {
    return res.status(400).json({ status: "error", message: "Hành động (action) không hợp lệ." });
  }

  await reviewPendingQuestions(id, action);

  res.json({ status: "ok", message: action === "APPROVE_ALL" ? "Đã phê duyệt toàn bộ." : "Đã hủy toàn bộ." });
});
