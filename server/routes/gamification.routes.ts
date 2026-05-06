import { Router } from "express";
import * as gamificationController from "../controllers/gamification.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /gamification/challenges:
 *   get:
 *     summary: Lấy danh sách thử thách của người dùng
 *     tags: [Gamification]
 */
router.get("/challenges", gamificationController.getMyChallenges);

/**
 * @swagger
 * /gamification/leaderboard:
 *   get:
 *     summary: Lấy bảng xếp hạng tuần
 *     tags: [Gamification]
 */
router.get("/leaderboard", gamificationController.getLeaderboard);

/**
 * @swagger
 * /gamification/stats:
 *   get:
 *     summary: Lấy thống kê EXP và cấp độ cá nhân
 *     tags: [Gamification]
 */
router.get("/stats", gamificationController.getMyStats);

export default router;
