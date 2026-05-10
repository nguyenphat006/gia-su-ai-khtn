import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { 
  processDocumentUpload, 
  getSourceDocuments, 
  reviewPendingQuestions,
  getDocumentContent
} from "../services/document.service.js";

/**
 * Upload tệp tài liệu để nạp tri thức RAG
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
    message: "Hệ thống đang tiến hành trích xuất tri thức từ tài liệu (Quá trình này chạy ngầm).",
    data: { document }
  });
});

/**
 * Lấy danh sách các tài liệu đã tải lên (phân trang, lọc)
 */
export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const grade = req.query.grade ? parseInt(req.query.grade as string) : undefined;

  const result = await getSourceDocuments({ page, limit, search, grade });
  res.json({ status: "ok", data: result });
});

/**
 * Lấy nội dung chi tiết của tài liệu
 */
export const getDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const document = await getDocumentContent(id);
  
  if (!document) {
    return res.status(404).json({ status: "error", message: "Không tìm thấy tài liệu." });
  }

  res.json({ status: "ok", data: { document } });
});

/**
 * Duyệt hoặc xóa các câu hỏi đang pending của một tài liệu
 */
export const reviewDocumentQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; 

  if (action !== "APPROVE_ALL" && action !== "DELETE_ALL") {
    return res.status(400).json({ status: "error", message: "Hành động (action) không hợp lệ." });
  }

  await reviewPendingQuestions(id, action);
  res.json({ status: "ok", message: action === "APPROVE_ALL" ? "Đã phê duyệt toàn bộ." : "Đã hủy toàn bộ." });
});
