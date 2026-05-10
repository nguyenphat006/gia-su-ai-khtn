import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth.js";
import * as reportController from "../controllers/report.controller.js";

const router = Router();

// Yêu cầu đăng nhập và chỉ ADMIN, TEACHER mới được xem báo cáo
router.use(authenticate, authorize(Role.ADMIN, Role.TEACHER));

/**
 * @swagger
 * /api/reports/chat-logs:
 *   get:
 *     summary: Lấy danh sách toàn bộ nhật ký hội thoại (Chat Logs)
 *     tags: [Reports]
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
 *           default: 50
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: "Tìm kiếm từ khóa trong tin nhắn (VD: 'tại sao', 'làm thế nào')"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Lọc theo UUID của một học sinh cụ thể
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get("/chat-logs", reportController.getChatLogs);

/**
 * @swagger
 * /api/reports/study-time:
 *   get:
 *     summary: Thống kê thời gian học tập (Analytics Heatmap)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê số lượng tương tác theo khung giờ và ngày trong tuần
 */
router.get("/study-time", reportController.getStudyTimeAnalytics);

/**
 * @swagger
 * /api/reports/leaderboard/monthly:
 *   get:
 *     summary: Lấy bảng xếp hạng theo tháng
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2026
 *         description: Năm cần lấy dữ liệu (Mặc định năm hiện tại)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 5
 *         description: Tháng cần lấy dữ liệu từ 1-12 (Mặc định tháng hiện tại)
 *     responses:
 *       200:
 *         description: Bảng xếp hạng Top 10 trong tháng
 */
router.get("/leaderboard/monthly", reportController.getMonthlyLeaderboard);

/**
 * @swagger
 * /api/reports/arena-logs:
 *   get:
 *     summary: Lấy danh sách toàn bộ lịch sử đấu Arena (PvP + AI)
 *     description: |
 *       Trả về danh sách trận đấu, mỗi trận là 1 object chứa thông tin cả 2 bên (player1 vs player2).
 *       Đối với trận AI, player2 sẽ có displayName là "Gia sư AI" và id là null.
 *       Hỗ trợ lọc theo userId (xem tất cả trận của 1 học sinh) và mode (PVP hoặc AI).
 *     tags: [Reports]
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
 *           default: 50
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Lọc lịch sử đấu của một học sinh cụ thể
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [PVP, AI]
 *         description: "Lọc theo chế độ đấu: PVP hoặc AI. Bỏ trống để lấy tất cả."
 *     responses:
 *       200:
 *         description: Danh sách trận đấu (mỗi trận 1 object gồm player1 và player2)
 */
router.get("/arena-logs", reportController.getArenaLogs);

/**
 * @swagger
 * /api/reports/arena-logs/{id}:
 *   get:
 *     summary: Lấy chi tiết một trận đấu Arena
 *     description: |
 *       Trả về thông tin chi tiết của trận đấu bao gồm cả 2 người chơi (player1, player2).
 *       Đối với trận PvP, hệ thống tự tìm record đối thủ dựa trên topic và thời gian.
 *       Đối với trận AI, player2 sẽ hiển thị "Gia sư AI".
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "e2b3491d-cf82-411a-9694-850d5338bece"
 *         description: ID của trận đấu (ArenaResult ID)
 *     responses:
 *       200:
 *         description: Thông tin chi tiết trận đấu (player1 vs player2)
 *       404:
 *         description: Không tìm thấy trận đấu
 */
router.get("/arena-logs/:id", reportController.getArenaLogDetail);

/**
 * @swagger
 * /api/reports/arena-export:
 *   get:
 *     summary: Xuất danh sách nhật ký Arena ra file Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về file Excel (.xlsx)
 */
router.get("/arena-export", reportController.exportArenaLogsExcel);

/**
 * @swagger
 * /api/reports/user-engagement:
 *   get:
 *     summary: Lấy thống kê chuyên cần và phân bổ bậc danh hiệu
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin về Streak và Ranks
 */
router.get("/user-engagement", reportController.getUserEngagementStats);

/**
 * @swagger
 * /api/reports/quiz-logs:
 *   get:
 *     summary: Lấy nhật ký làm bài ôn tập (Quiz History) của học sinh
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về danh sách QuizHistory
 */
router.get("/quiz-logs", reportController.getQuizLogs);

export default router;
