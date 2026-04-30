import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listUsers,
  getUser,
  createNewUser,
  updateUser,
  removeUsers,
  updateProfile,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// ========================================
// SELF — Người dùng tự cập nhật hồ sơ
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, ARCHIVED]
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách người dùng
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
 *               email:
 *                 type: string
 *               classId:
 *                 type: string
 *               studentCode:
 *                 type: string
 *                 description: Bắt buộc khi role = STUDENT
 *               grade:
 *                 type: integer
 *                 description: Bắt buộc khi role = STUDENT (6–9)
 *               employeeCode:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 *   delete:
 *     summary: Xóa nhiều người dùng (bulk delete)
 *     tags: [Users - Quản lý]
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
router.get("/", authenticate, authorize(Role.ADMIN), listUsers);
router.post("/", authenticate, authorize(Role.ADMIN), createNewUser);
router.delete("/", authenticate, authorize(Role.ADMIN), removeUsers);

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
 *     responses:
 *       200:
 *         description: Thông tin chi tiết người dùng
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get("/:id", authenticate, authorize(Role.ADMIN), getUser);
router.put("/:id", authenticate, authorize(Role.ADMIN), updateUser);

export default router;
