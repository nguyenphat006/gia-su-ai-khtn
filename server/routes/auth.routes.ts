import { Router } from "express";
import {
  login,
  logout,
  refresh,
  getMyProfile,
  changeUserPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống (username/email/studentCode)
 *     tags: [Auth]
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Auth]
 */
router.post("/logout", authenticate, logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới Access Token bằng Refresh Token (qua Cookie)
 *     tags: [Auth]
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng hiện tại
 *     tags: [Auth]
 */
router.get("/me", authenticate, getMyProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu người dùng
 *     tags: [Auth]
 */
router.post("/change-password", authenticate, changeUserPassword);

export default router;
