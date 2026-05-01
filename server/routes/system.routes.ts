import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth.js";
import { getConfig, listConfigs, updateConfig, addConfig, removeConfigs } from "../controllers/system.controller.js";

const router = Router();

/**
 * @swagger
 * /api/system/configs:
 *   get:
 *     summary: Lấy danh sách cấu hình hệ thống
 *     tags: [System Configs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách cấu hình hệ thống
 */
router.get("/configs", authenticate, authorize(Role.ADMIN, Role.TEACHER), listConfigs);

/**
 * @swagger
 * /api/system/configs:
 *   post:
 *     summary: Thêm cấu hình hệ thống mới
 *     tags: [System Configs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post("/configs", authenticate, authorize(Role.ADMIN), addConfig);

/**
 * @swagger
 * /api/system/configs/{key}:
 *   get:
 *     summary: "Lấy chi tiết một cấu hình (VD: AI_SYSTEM_PROMPT)"
 *     tags: [System Configs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Khóa cấu hình
 *     responses:
 *       200:
 *         description: Chi tiết cấu hình
 */
router.get("/configs/:key", authenticate, authorize(Role.ADMIN, Role.TEACHER), getConfig);

/**
 * @swagger
 * /api/system/configs/{key}:
 *   put:
 *     summary: Cập nhật cấu hình hệ thống
 *     tags: [System Configs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Khóa cấu hình
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/configs/:key", authenticate, authorize(Role.ADMIN), updateConfig);

/**
 * @swagger
 * /api/system/configs:
 *   delete:
 *     summary: Xóa nhiều cấu hình hệ thống (bulk delete)
 *     tags: [System Configs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [keys]
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["KEY_1", "KEY_2"]
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/configs", authenticate, authorize(Role.ADMIN), removeConfigs);

export default router;
