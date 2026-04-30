import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createFlashcard,
  createMindmap,
  createQuestionBank,
  deleteFlashcard,
  deleteMindmap,
  deleteQuestionBank,
  getFlashcards,
  getMindmaps,
  getQuestionBank
} from "../controllers/revision.controller.js";

const router = Router();

// Bắt buộc đăng nhập
router.use(authenticate);

// ==========================================
// CLIENT ROUTES (Học sinh sử dụng)
// ==========================================

/**
 * @swagger
 * /api/revision/questions:
 *   get:
 *     summary: Lấy ngân hàng câu hỏi ôn tập
 *     tags: [Revision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Lớp (UUID của Class)
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Chủ đề (VD Năng lượng)
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Mức độ (EASY, MEDIUM, HARD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Dạng câu hỏi (MULTIPLE_CHOICE, ESSAY)
 *     responses:
 *       200:
 *         description: Danh sách câu hỏi
 */
router.get("/questions", getQuestionBank);

/**
 * @swagger
 * /api/revision/flashcards:
 *   get:
 *     summary: Lấy danh sách bộ Flashcard
 *     tags: [Revision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách flashcard
 */
router.get("/flashcards", getFlashcards);

/**
 * @swagger
 * /api/revision/mindmaps:
 *   get:
 *     summary: Lấy danh sách Sơ đồ tư duy
 *     tags: [Revision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách mindmap
 */
router.get("/mindmaps", getMindmaps);

// ==========================================
// ADMIN ROUTES (Giáo viên/Admin quản lý)
// ==========================================

/**
 * @swagger
 * /api/revision/questions:
 *   post:
 *     summary: Thêm câu hỏi mới vào Ngân hàng
 *     tags: [Revision]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, topic, type, difficulty, content, correctAnswer]
 *             properties:
 *               classId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               topic:
 *                 type: string
 *                 example: "Động lực học"
 *               type:
 *                 type: string
 *                 example: "MULTIPLE_CHOICE"
 *               difficulty:
 *                 type: string
 *                 example: "EASY"
 *               content:
 *                 type: string
 *                 example: "Vận tốc là gì?"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Quãng đường chia thời gian", "Thời gian chia quãng đường"]
 *               correctAnswer:
 *                 type: string
 *                 example: "Quãng đường chia thời gian"
 *               explanation:
 *                 type: string
 *                 example: "Công thức v = s/t"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *   delete:
 *     summary: Xóa nhiều câu hỏi (truyền mảng ids trong body)
 *     tags: [Revision]
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
router.post("/questions", authorize(Role.ADMIN, Role.TEACHER), createQuestionBank);
router.delete("/questions", authorize(Role.ADMIN, Role.TEACHER), deleteQuestionBank);

/**
 * @swagger
 * /api/revision/flashcards:
 *   post:
 *     summary: Thêm bộ Flashcard mới
 *     tags: [Revision]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, topic, title, cards]
 *             properties:
 *               classId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               topic:
 *                 type: string
 *                 example: "Lực"
 *               title:
 *                 type: string
 *                 example: "Các khái niệm về lực"
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example: [{"front": "Khối lượng", "back": "Đại lượng chỉ lượng chất"}]
 *     responses:
 *       201:
 *         description: Tạo thành công
 *   delete:
 *     summary: Xóa nhiều bộ flashcard (truyền mảng ids)
 *     tags: [Revision]
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
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.post("/flashcards", authorize(Role.ADMIN, Role.TEACHER), createFlashcard);
router.delete("/flashcards", authorize(Role.ADMIN, Role.TEACHER), deleteFlashcard);

/**
 * @swagger
 * /api/revision/mindmaps:
 *   post:
 *     summary: Thêm Sơ đồ tư duy mới
 *     tags: [Revision]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, topic, title, markdown]
 *             properties:
 *               classId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               topic:
 *                 type: string
 *                 example: "Tế bào"
 *               title:
 *                 type: string
 *                 example: "Cấu tạo tế bào"
 *               markdown:
 *                 type: string
 *                 example: "graph TD;\n A-->B;"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *   delete:
 *     summary: Xóa nhiều mindmap (truyền mảng ids)
 *     tags: [Revision]
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
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.post("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), createMindmap);
router.delete("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), deleteMindmap);

export default router;
