import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";
import {
  createNewSession,
  listMessages,
  listSessions,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = Router();

// Tất cả API chat đều yêu cầu đăng nhập
router.use(authenticate);

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: Lấy danh sách các phiên trò chuyện của user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phiên trò chuyện
 */
router.get("/sessions", listSessions);

/**
 * @swagger
 * /api/chat/sessions:
 *   post:
 *     summary: Tạo một phiên trò chuyện mới
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Hỏi đáp Vật lý 8"
 *     responses:
 *       201:
 *         description: Phiên trò chuyện mới được tạo
 */
router.post("/sessions", createNewSession);

/**
 * @swagger
 * /api/chat/sessions/{id}/messages:
 *   get:
 *     summary: Lấy lịch sử tin nhắn của một phiên
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phiên trò chuyện
 *     responses:
 *       200:
 *         description: Lịch sử tin nhắn
 */
router.get("/sessions/:id/messages", listMessages);

/**
 * @swagger
 * /api/chat/sessions/{id}/messages:
 *   post:
 *     summary: Gửi tin nhắn mới cho AI
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của phiên trò chuyện
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Vận tốc là gì?"
 *               imageBase64:
 *                 type: string
 *                 description: "Base64 của ảnh nếu có"
 *                 example: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
 *               mimeType:
 *                 type: string
 *                 description: "MimeType của ảnh đính kèm"
 *                 example: "image/png"
 *     responses:
 *       200:
 *         description: Phản hồi từ AI (Kèm tin nhắn của user và AI, cộng 10 EXP)
 */
router.post("/sessions/:id/messages", sendMessage);

export default router;
