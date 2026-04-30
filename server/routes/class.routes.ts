import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listClasses,
  getClass,
  createNewClass,
  updateExistingClass,
  removeClasses,
} from "../controllers/class.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Lấy danh sách lớp học (phân trang, tìm kiếm, lọc)
 *     tags: [Classes - Lớp học]
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
 *         description: Tìm theo mã lớp hoặc tên lớp
 *       - in: query
 *         name: grade
 *         schema:
 *           type: integer
 *           enum: [6, 7, 8, 9]
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: "VD: 2024-2025"
 *     responses:
 *       200:
 *         description: Danh sách lớp học
 *   post:
 *     summary: Tạo lớp học mới
 *     tags: [Classes - Lớp học]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, grade, academicYear]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "6A1"
 *               name:
 *                 type: string
 *                 example: "Lớp 6A1"
 *               grade:
 *                 type: integer
 *                 example: 6
 *               academicYear:
 *                 type: string
 *                 example: "2024-2025"
 *     responses:
 *       201:
 *         description: Tạo lớp thành công
 *   delete:
 *     summary: Xóa nhiều lớp học (chỉ xóa được khi không còn học sinh)
 *     tags: [Classes - Lớp học]
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
router.get("/", authenticate, listClasses);
router.post("/", authenticate, authorize(Role.ADMIN), createNewClass);
router.delete("/", authenticate, authorize(Role.ADMIN), removeClasses);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Lấy chi tiết một lớp (kèm danh sách học sinh)
 *     tags: [Classes - Lớp học]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chi tiết lớp
 *   put:
 *     summary: Cập nhật thông tin lớp học
 *     tags: [Classes - Lớp học]
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
 *               code:
 *                 type: string
 *                 example: "6A1"
 *               name:
 *                 type: string
 *                 example: "Lớp 6A1"
 *               grade:
 *                 type: integer
 *                 example: 6
 *               academicYear:
 *                 type: string
 *                 example: "2024-2025"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get("/:id", authenticate, getClass);
router.put("/:id", authenticate, authorize(Role.ADMIN), updateExistingClass);

export default router;
