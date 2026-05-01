import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  generateDraft,
  createFlashcard,
  createMindmap,
  createQuestionBank,
  deleteFlashcard,
  deleteMindmap,
  deleteQuestionBank,
  getFlashcards,
  getMindmaps,
  getQuestionBank,
  generateStudentQuiz,
  submitStudentQuiz,
  getStudentFlashcards,
  getStudentMindmap
} from "../controllers/revision.controller.js";

const router = Router();

// Bắt buộc đăng nhập cho tất cả các route trong module này
router.use(authenticate);

// ==========================================
// 1. ADMIN/TEACHER ROUTES (Quản lý nội dung)
// ==========================================

/**
 * @swagger
 * /api/revision/questions:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách câu hỏi ôn tập"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: ID của lớp học
 *       - in: query
 *         name: grade
 *         schema:
 *           type: integer
 *         example: 6
 *         description: Khối lớp (6, 7, 8, 9)
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         example: "Năng lượng"
 *         description: Tìm kiếm theo chủ đề
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         example: "MEDIUM"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MULTIPLE_CHOICE, ESSAY]
 *         example: "MULTIPLE_CHOICE"
 *     responses:
 *       200:
 *         description: Trả về danh sách câu hỏi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data: 
 *                   type: object
 *                   properties:
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *   post:
 *     summary: "[Admin/Teacher] Thêm câu hỏi mới vào Ngân hàng"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic, type, difficulty, content, correctAnswer]
 *             properties:
 *               grade:
 *                 type: integer
 *                 example: 6
 *               topic:
 *                 type: string
 *                 example: "Hệ mặt trời"
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, ESSAY]
 *                 example: "MULTIPLE_CHOICE"
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 example: "EASY"
 *               content:
 *                 type: string
 *                 example: "Hành tinh nào gần mặt trời nhất?"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Sao Kim", "Sao Thủy", "Trái Đất", "Sao Hỏa"]
 *               correctAnswer:
 *                 type: string
 *                 example: "Sao Thủy"
 *               explanation:
 *                 type: string
 *                 example: "Sao Thủy là hành tinh thứ nhất trong hệ mặt trời."
 *     responses:
 *       201:
 *         description: "Tạo thành công"
 *   delete:
 *     summary: "[Admin/Teacher] Xóa nhiều câu hỏi (truyền mảng ids)"
 *     tags: [Revision Admin]
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
 *                 example: ["id1", "id2"]
 *     responses:
 *       200:
 *         description: "Xóa thành công"
 */
router.get("/questions", authorize(Role.ADMIN, Role.TEACHER), getQuestionBank);
router.post("/questions", authorize(Role.ADMIN, Role.TEACHER), createQuestionBank);
router.delete("/questions", authorize(Role.ADMIN, Role.TEACHER), deleteQuestionBank);

/**
 * @swagger
 * /api/revision/flashcards:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách bộ Flashcard"
 *     tags: [Revision Admin]
 *     parameters:
 *       - in: query
 *         name: grade
 *         schema:
 *           type: integer
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Thành công"
 *   post:
 *     summary: "[Admin/Teacher] Tạo bộ Flashcard mới"
 *     tags: [Revision Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic, title, cards]
 *             properties:
 *               grade:
 *                 type: integer
 *                 example: 7
 *               topic:
 *                 type: string
 *                 example: "Tế bào"
 *               title:
 *                 type: string
 *                 example: "Cấu tạo tế bào nhân sơ"
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     front:
 *                       type: string
 *                     back:
 *                       type: string
 *                 example: [{front: "DNA", back: "Vật chất di truyền"}]
 *     responses:
 *       201:
 *         description: "Tạo thành công"
 *   delete:
 *     summary: "[Admin/Teacher] Xóa nhiều bộ Flashcard"
 *     tags: [Revision Admin]
 *     responses:
 *       200:
 *         description: "Xóa thành công"
 */
router.get("/flashcards", authorize(Role.ADMIN, Role.TEACHER), getFlashcards);
router.post("/flashcards", authorize(Role.ADMIN, Role.TEACHER), createFlashcard);
router.delete("/flashcards", authorize(Role.ADMIN, Role.TEACHER), deleteFlashcard);

/**
 * @swagger
 * /api/revision/mindmaps:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách Sơ đồ tư duy"
 *     tags: [Revision Admin]
 *     responses:
 *       200:
 *         description: "Thành công"
 *   post:
 *     summary: "[Admin/Teacher] Tạo Sơ đồ tư duy mới"
 *     tags: [Revision Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic, title, markdown]
 *     responses:
 *       201:
 *         description: "Tạo thành công"
 *   delete:
 *     summary: "[Admin/Teacher] Xóa Sơ đồ tư duy"
 *     tags: [Revision Admin]
 *     responses:
 *       200:
 *         description: "Xóa thành công"
 */
router.get("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), getMindmaps);
router.post("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), createMindmap);
router.delete("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), deleteMindmap);

/**
 * @swagger
 * /api/revision/admin/generate:
 *   post:
 *     summary: "[Admin/Teacher] Gọi AI sinh nội dung nháp"
 *     tags: [Revision Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, grade, topic]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [QUIZ, FLASHCARD, MINDMAP]
 *               grade:
 *                 type: integer
 *                 example: 6
 *               topic:
 *                 type: string
 *                 example: "Quang hợp"
 *               count:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: "Thành công"
 */
router.post("/admin/generate", authorize(Role.ADMIN, Role.TEACHER), generateDraft);

// ==========================================
// 2. STUDENT ROUTES (Hoạt động ôn tập)
// ==========================================

/**
 * @swagger
 * /api/revision/quiz/generate:
 *   post:
 *     summary: "[Student] Lấy bộ câu hỏi ôn tập (Hybrid: Bank + AI)"
 *     tags: [Revision Student]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic]
 *             properties:
 *               grade:
 *                 type: integer
 *                 example: 6
 *               topic:
 *                 type: string
 *                 example: "Năng lượng"
 *               limit:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: "Thành công"
 */
router.post("/quiz/generate", authorize(Role.STUDENT, Role.ADMIN), generateStudentQuiz);

/**
 * @swagger
 * /api/revision/quiz/submit:
 *   post:
 *     summary: "[Student] Nộp kết quả quiz và nhận XP"
 *     tags: [Revision Student]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quizType, totalQuestions, correctCount]
 *     responses:
 *       200:
 *         description: "Thành công"
 */
router.post("/quiz/submit", authorize(Role.STUDENT, Role.ADMIN), submitStudentQuiz);

/**
 * @swagger
 * /api/revision/flashcards/get:
 *   post:
 *     summary: "[Student] Lấy bộ Flashcard theo chủ đề"
 *     tags: [Revision Student]
 *     responses:
 *       200:
 *         description: "Thành công"
 */
router.post("/flashcards/get", authorize(Role.STUDENT, Role.ADMIN), getStudentFlashcards);

/**
 * @swagger
 * /api/revision/mindmap/get:
 *   post:
 *     summary: "[Student] Lấy Mindmap theo chủ đề"
 *     tags: [Revision Student]
 *     responses:
 *       200:
 *         description: "Thành công"
 */
router.post("/mindmap/get", authorize(Role.STUDENT, Role.ADMIN), getStudentMindmap);

export default router;
