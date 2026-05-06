import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { uploadDocument, listDocuments, reviewDocumentQuestions } from "../controllers/document.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: API Quản lý Tài liệu AI Ingestion
 */

// Cấu hình Multer lưu file tạm trên RAM
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Tối đa 50MB
  },
});

router.use(authenticate);

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload sách/tài liệu để AI đọc và sinh câu hỏi
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File PDF, DOCX hoặc TXT
 *               grade:
 *                 type: integer
 *                 description: Khối lớp (VD 6, 7, 8, 9)
 *               topic:
 *                 type: string
 *                 description: Chủ đề (Tùy chọn)
 *     responses:
 *       202:
 *         description: Đã tiếp nhận tài liệu và đang xử lý nền
 */
router.post("/upload", upload.single("file"), uploadDocument);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Lấy danh sách tài liệu đang/đã phân tích
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách SourceDocument
 */
router.get("/", listDocuments);

/**
 * @swagger
 * /api/documents/{id}/review:
 *   post:
 *     summary: Duyệt hoặc Xóa toàn bộ câu hỏi pending của một tài liệu
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của tài liệu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE_ALL, DELETE_ALL]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/:id/review", reviewDocumentQuestions);

export default router;
