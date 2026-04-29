import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createDocument,
  listDocuments,
  removeDocument,
  updateDocument,
} from "../controllers/knowledge.controller.js";

const router = Router();

/**
 * @swagger
 * /api/knowledge:
 *   get:
 *     summary: Lấy danh sách tài liệu tri thức
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *         description: Trạng thái tài liệu (ví dụ active=true)
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
 */
router.get("/", authenticate, authorize(Role.ADMIN, Role.TEACHER), listDocuments);

/**
 * @swagger
 * /api/knowledge:
 *   post:
 *     summary: Thêm tài liệu mới vào hệ thống
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Bài 1: Giới thiệu KHTN 6"
 *               content:
 *                 type: string
 *                 example: "Khoa học tự nhiên là một nhánh của khoa học..."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["khtn6", "chuong1"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/", authenticate, authorize(Role.ADMIN, Role.TEACHER), createDocument);

/**
 * @swagger
 * /api/knowledge/{id}:
 *   put:
 *     summary: Cập nhật tài liệu tri thức
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Bài 1: Giới thiệu KHTN 6 (Cập nhật)"
 *               content:
 *                 type: string
 *                 example: "Nội dung cập nhật..."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["khtn6"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", authenticate, authorize(Role.ADMIN, Role.TEACHER), updateDocument);

/**
 * @swagger
 * /api/knowledge/{id}:
 *   delete:
 *     summary: Xóa tài liệu khỏi hệ thống
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", authenticate, authorize(Role.ADMIN, Role.TEACHER), removeDocument);

export default router;
