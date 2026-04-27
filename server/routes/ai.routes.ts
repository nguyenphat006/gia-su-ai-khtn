import { Router } from "express";
import {
  chatWithAI,
  createQuiz,
  createFlashcards,
  createMindmap,
  analyzeResult,
  evaluateEssayAnswer,
} from "../controllers/ai.controller.js";

const router = Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat với Gia sư AI
 *     tags: [AI - Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Tin nhắn của học sinh
 *                 example: "Giải thích cho em về lực hấp dẫn"
 *               history:
 *                 type: array
 *                 description: Lịch sử hội thoại
 *                 items:
 *                   type: object
 *               context:
 *                 type: string
 *                 description: Ngữ cảnh tài liệu (nếu có)
 *               image:
 *                 type: object
 *                 description: Hình ảnh đính kèm (base64)
 *                 properties:
 *                   data:
 *                     type: string
 *                   mimeType:
 *                     type: string
 *     responses:
 *       200:
 *         description: Phản hồi từ AI
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
 *                     reply:
 *                       type: string
 */
router.post("/chat", chatWithAI);

/**
 * @swagger
 * /api/ai/quiz:
 *   post:
 *     summary: Tạo bộ câu hỏi Quiz (Trắc nghiệm / Tự luận)
 *     tags: [AI - Quiz]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic]
 *             properties:
 *               topic:
 *                 type: string
 *                 example: "Lực hấp dẫn"
 *               grade:
 *                 type: string
 *                 example: "Lớp 6"
 *               type:
 *                 type: string
 *                 enum: ["Trắc nghiệm", "Tự luận", "Trắc nghiệm & Tự luận"]
 *                 example: "Trắc nghiệm"
 *               count:
 *                 type: integer
 *                 example: 5
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bộ câu hỏi JSON
 */
router.post("/quiz", createQuiz);

/**
 * @swagger
 * /api/ai/flashcards:
 *   post:
 *     summary: Tạo bộ Flashcards học tập
 *     tags: [AI - Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, grade]
 *             properties:
 *               topic:
 *                 type: string
 *                 example: "Quang hợp"
 *               grade:
 *                 type: string
 *                 example: "Lớp 7"
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bộ Flashcards JSON
 */
router.post("/flashcards", createFlashcards);

/**
 * @swagger
 * /api/ai/mindmap:
 *   post:
 *     summary: Tạo cấu trúc Mindmap
 *     tags: [AI - Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, grade]
 *             properties:
 *               topic:
 *                 type: string
 *                 example: "Hệ tiêu hóa"
 *               grade:
 *                 type: string
 *                 example: "Lớp 8"
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mindmap JSON
 */
router.post("/mindmap", createMindmap);

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Phân tích kết quả bài làm của học sinh
 *     tags: [AI - Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, results]
 *             properties:
 *               topic:
 *                 type: string
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kết quả phân tích
 */
router.post("/analyze", analyzeResult);

/**
 * @swagger
 * /api/ai/evaluate-essay:
 *   post:
 *     summary: Chấm bài tự luận
 *     tags: [AI - Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Trình bày quá trình quang hợp"
 *               answer:
 *                 type: string
 *               image:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                   mimeType:
 *                     type: string
 *     responses:
 *       200:
 *         description: Kết quả chấm
 */
router.post("/evaluate-essay", evaluateEssayAnswer);

export default router;
