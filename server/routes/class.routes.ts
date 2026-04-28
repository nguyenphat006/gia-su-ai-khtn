import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listClasses,
  getClass,
  createNewClass,
  updateExistingClass,
  removeClass,
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
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang
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
 *         description: Lọc theo khối lớp
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: "Lọc theo năm học (VD: 2024-2025)"
 *     responses:
 *       200:
 *         description: Danh sách lớp học
 */
router.get("/", authenticate, listClasses);

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
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Thông tin chi tiết lớp
 */
router.get("/:id", authenticate, getClass);

/**
 * @swagger
 * /api/classes:
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
 *                 description: Mã lớp (duy nhất)
 *                 example: "6A1"
 *               name:
 *                 type: string
 *                 description: Tên lớp
 *                 example: "Lớp 6A1"
 *               grade:
 *                 type: integer
 *                 description: Khối lớp (6-9)
 *                 example: 6
 *               academicYear:
 *                 type: string
 *                 description: Năm học
 *                 example: "2024-2025"
 *     responses:
 *       201:
 *         description: Tạo lớp thành công
 */
router.post("/", authenticate, authorize(Role.ADMIN), createNewClass);

/**
 * @swagger
 * /api/classes/{id}:
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
router.put("/:id", authenticate, authorize(Role.ADMIN), updateExistingClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Xóa lớp học (chỉ khi không còn học sinh)
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
 *         description: Xóa thành công
 */
router.delete("/:id", authenticate, authorize(Role.ADMIN), removeClass);

export default router;
