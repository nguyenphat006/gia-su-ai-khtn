import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listUsers,
  getUser,
  createNewUser,
  updateUser,
  removeUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// ========================================
// SELF — Người dùng tự cập nhật hồ sơ
// (Phải đặt TRƯỚC /:id để tránh conflict)
// ========================================

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân (tên hiển thị, ảnh đại diện)
 *     tags: [Users - Hồ sơ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               avatarUrl:
 *                 type: string
 *                 example: "https://example.com/avatar.png"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/me", authenticate, updateProfile);

// ========================================
// CRUD — Chỉ dành cho Admin
// ========================================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng (phân trang, tìm kiếm, lọc)
 *     tags: [Users - Quản lý]
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
 *         description: Số lượng mỗi trang (tối đa 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên, username, email hoặc mã học sinh
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, TEACHER, ADMIN]
 *         description: Lọc theo vai trò
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, ARCHIVED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Lọc theo lớp học
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get("/", authenticate, authorize(Role.ADMIN), listUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết một người dùng
 *     tags: [Users - Quản lý]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết người dùng
 */
router.get("/:id", authenticate, authorize(Role.ADMIN), getUser);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo người dùng mới
 *     tags: [Users - Quản lý]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, username, displayName]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [STUDENT, TEACHER, ADMIN]
 *                 example: "STUDENT"
 *               username:
 *                 type: string
 *                 example: "hs002"
 *               displayName:
 *                 type: string
 *                 example: "Trần Thị B"
 *               password:
 *                 type: string
 *                 description: "Mặc định: 123456abc"
 *                 example: "123456abc"
 *               email:
 *                 type: string
 *                 example: "hs002@school.edu.vn"
 *               classId:
 *                 type: string
 *               studentCode:
 *                 type: string
 *                 description: Bắt buộc khi role = STUDENT
 *                 example: "HS2023002"
 *               grade:
 *                 type: integer
 *                 description: Bắt buộc khi role = STUDENT (6–9)
 *                 example: 7
 *               employeeCode:
 *                 type: string
 *                 description: Dành cho Teacher/Admin
 *               subject:
 *                 type: string
 *                 description: Dành cho Teacher
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 */
router.post("/", authenticate, authorize(Role.ADMIN), createNewUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users - Quản lý]
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
 *               displayName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [STUDENT, TEACHER, ADMIN]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED, ARCHIVED]
 *               classId:
 *                 type: string
 *                 nullable: true
 *               studentCode:
 *                 type: string
 *               grade:
 *                 type: integer
 *               employeeCode:
 *                 type: string
 *               subject:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Reset mật khẩu mới cho user
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", authenticate, authorize(Role.ADMIN), updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa người dùng
 *     tags: [Users - Quản lý]
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
router.delete("/:id", authenticate, authorize(Role.ADMIN), removeUser);

export default router;
