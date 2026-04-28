import { Router } from "express";
import { Role } from "@prisma/client";
import {
  login,
  logout,
  refresh,
  getMyProfile,
  changeUserPassword,
  provisionSchoolUser,
  bootstrapDefaults,
} from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /api/auth/bootstrap:
 *   post:
 *     summary: Khởi tạo tài khoản Admin và Teacher mặc định
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: Khởi tạo thành công
 */
router.post("/bootstrap", bootstrapDefaults);

/**
 * @swagger
 * /api/auth/users/provision:
 *   post:
 *     summary: Admin/Teacher tạo tài khoản (CRUD Auth)
 *     tags: [Auth]
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
 *                 example: "hs001"
 *               displayName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               password:
 *                 type: string
 *                 description: "Nếu không nhập sẽ lấy mặc định là 123456"
 *                 example: "123456"
 *               email:
 *                 type: string
 *                 example: "hs001@school.edu.vn"
 *               studentCode:
 *                 type: string
 *                 example: "HS2023001"
 *               grade:
 *                 type: integer
 *                 example: 6
 *               classId:
 *                 type: string
 *                 example: "uuid-of-class"
 *     responses:
 *       201:
 *         description: Đã tạo tài khoản thành công
 */
router.post("/users/provision", authenticate, authorize(Role.ADMIN, Role.TEACHER), provisionSchoolUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: "Có thể là username, email hoặc studentCode"
 *                 example: "hs001"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về cookie và user profile
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã xóa cookie và revoke session
 */
router.post("/logout", authenticate, logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới Access Token
 *     tags: [Auth]
 *     description: "Sử dụng Refresh Token trong httpOnly cookie để cấp lại bộ token mới"
 *     responses:
 *       200:
 *         description: Cấp lại token thành công
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về user profile (bao gồm class, studentProfile, stats)
 */
router.get("/me", authenticate, getMyProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
router.post("/change-password", authenticate, changeUserPassword);

export default router;
