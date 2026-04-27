import { Router } from "express";
import { extractText } from "../controllers/file.controller.js";

const router = Router();

/**
 * @swagger
 * /api/files/extract:
 *   post:
 *     summary: Trích xuất văn bản từ file PDF/Word/Text
 *     tags: [File]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileData, mimeType]
 *             properties:
 *               fileData:
 *                 type: string
 *                 description: Nội dung file dạng base64 (data URI)
 *                 example: "data:application/pdf;base64,JVBERi0xLj..."
 *               fileName:
 *                 type: string
 *                 example: "bai_tap_vat_ly.pdf"
 *               mimeType:
 *                 type: string
 *                 enum: [application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain]
 *                 example: "application/pdf"
 *     responses:
 *       200:
 *         description: Văn bản đã trích xuất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     fileName:
 *                       type: string
 *       400:
 *         description: Thiếu dữ liệu hoặc loại file không hỗ trợ
 */
router.post("/extract", extractText);

export default router;
