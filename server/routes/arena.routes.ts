import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  generateQuiz,
  submitResult,
  leaderboard,
  myStats,
  analyzePerformance,
} from "../controllers/arena.controller.js";

const router = Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

/**
 * @swagger
 * /api/arena/generate-quiz:
 *   post:
 *     summary: AI tạo bộ câu hỏi cho trận đấu
 *     tags: [Arena]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic]
 *             properties:
 *               classId:
 *                 type: string
 *                 description: UUID của Class (tùy chọn)
 *               grade:
 *                 type: string
 *                 example: "8"
 *               topic:
 *                 type: string
 *                 example: "Lực và chuyển động"
 *               type:
 *                 type: string
 *                 enum: ["Trắc nghiệm", "Tự luận", "Trắc nghiệm & Tự luận"]
 *                 example: "Trắc nghiệm"
 *               difficulty:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Nhận biết", "Thông hiểu", "Vận dụng"]
 *               count:
 *                 type: integer
 *                 maximum: 20
 *                 example: 10
 *     responses:
 *       200:
 *         description: Bộ câu hỏi được AI tạo thành công
 *       422:
 *         description: AI không thể tạo câu hỏi (thiếu tài liệu)
 */
router.post("/generate-quiz", generateQuiz);

/**
 * @swagger
 * /api/arena/results:
 *   post:
 *     summary: Lưu kết quả trận đấu (tự động cộng XP)
 *     tags: [Arena]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score, mode, winner, opponent]
 *             properties:
 *               score:
 *                 type: integer
 *                 example: 80
 *               mode:
 *                 type: string
 *                 enum: ["PVP", "AI"]
 *                 example: "AI"
 *               winner:
 *                 type: boolean
 *                 example: true
 *               opponent:
 *                 type: string
 *                 example: "Gia sư AI"
 *               topic:
 *                 type: string
 *                 example: "Năng lượng"
 *     responses:
 *       201:
 *         description: Lưu kết quả thành công
 */
router.post("/results", submitResult);

/**
 * @swagger
 * /api/arena/leaderboard:
 *   get:
 *     summary: Bảng xếp hạng top N chiến binh
 *     tags: [Arena]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng top (tối đa 50)
 *     responses:
 *       200:
 *         description: Danh sách bảng xếp hạng
 */
router.get("/leaderboard", leaderboard);

/**
 * @swagger
 * /api/arena/my-stats:
 *   get:
 *     summary: Thống kê cá nhân (số trận, thắng, thua, tổng điểm)
 *     tags: [Arena]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê cá nhân
 */
router.get("/my-stats", myStats);

/**
 * @swagger
 * /api/arena/analyze:
 *   post:
 *     summary: Phân tích hiệu suất sau trận đấu AI
 *     tags: [Arena]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, results]
 *             properties:
 *               topic:
 *                 type: string
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 */
router.post("/analyze", analyzePerformance);

export default router;
