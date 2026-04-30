import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createDocument,
  listDocuments,
  removeDocuments,
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái (true/false)
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
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
 *             required: [title, content]
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
 *   delete:
 *     summary: Xóa nhiều tài liệu (bulk delete)
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["id-1", "id-2"]
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.get("/", authenticate, authorize(Role.ADMIN, Role.TEACHER), listDocuments);
router.post("/", authenticate, authorize(Role.ADMIN, Role.TEACHER), createDocument);
router.delete("/", authenticate, authorize(Role.ADMIN, Role.TEACHER), removeDocuments);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", authenticate, authorize(Role.ADMIN, Role.TEACHER), updateDocument);

export default router;
