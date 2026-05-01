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
  updateFlashcard,
  updateMindmap,
  updateQuestionBank,
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
 *     summary: "[Admin/Teacher] Lấy danh sách câu hỏi ôn tập (Phân trang)"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *       - in: query
 *         name: grade
 *         schema: { type: integer }
 *       - in: query
 *         name: topic
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [EASY, MEDIUM, HARD] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [MULTIPLE_CHOICE, ESSAY] }
 *     responses:
 *       200: { description: "Thành công" }
 *   post:
 *     summary: "[Admin/Teacher] Thêm câu hỏi mới"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: "Tạo thành công" }
 *   delete:
 *     summary: "[Admin/Teacher] Xóa nhiều câu hỏi"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/questions", authorize(Role.ADMIN, Role.TEACHER), getQuestionBank);
router.post("/questions", authorize(Role.ADMIN, Role.TEACHER), createQuestionBank);
router.delete("/questions", authorize(Role.ADMIN, Role.TEACHER), deleteQuestionBank);

/**
 * @swagger
 * /api/revision/questions/{id}:
 *   put:
 *     summary: "[Admin/Teacher] Cập nhật câu hỏi"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.put("/questions/:id", authorize(Role.ADMIN, Role.TEACHER), updateQuestionBank);

/**
 * @swagger
 * /api/revision/flashcards:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách bộ Flashcard (Phân trang)"
 *     tags: [Revision Admin]
 *   post:
 *     summary: "[Admin/Teacher] Tạo bộ Flashcard mới"
 *     tags: [Revision Admin]
 *   delete:
 *     summary: "[Admin/Teacher] Xóa nhiều bộ Flashcard"
 *     tags: [Revision Admin]
 */
router.get("/flashcards", authorize(Role.ADMIN, Role.TEACHER), getFlashcards);
router.post("/flashcards", authorize(Role.ADMIN, Role.TEACHER), createFlashcard);
router.delete("/flashcards", authorize(Role.ADMIN, Role.TEACHER), deleteFlashcard);

/**
 * @swagger
 * /api/revision/flashcards/{id}:
 *   put:
 *     summary: "[Admin/Teacher] Cập nhật bộ Flashcard"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.put("/flashcards/:id", authorize(Role.ADMIN, Role.TEACHER), updateFlashcard);

/**
 * @swagger
 * /api/revision/mindmaps:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách Sơ đồ tư duy (Phân trang)"
 *     tags: [Revision Admin]
 *   post:
 *     summary: "[Admin/Teacher] Tạo Sơ đồ tư duy mới"
 *     tags: [Revision Admin]
 *   delete:
 *     summary: "[Admin/Teacher] Xóa Sơ đồ tư duy"
 *     tags: [Revision Admin]
 */
router.get("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), getMindmaps);
router.post("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), createMindmap);
router.delete("/mindmaps", authorize(Role.ADMIN, Role.TEACHER), deleteMindmap);

/**
 * @swagger
 * /api/revision/mindmaps/{id}:
 *   put:
 *     summary: "[Admin/Teacher] Cập nhật Sơ đồ tư duy"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.put("/mindmaps/:id", authorize(Role.ADMIN, Role.TEACHER), updateMindmap);

/**
 * @swagger
 * /api/revision/admin/generate:
 *   post:
 *     summary: "[Admin/Teacher] Gọi AI sinh nội dung nháp"
 *     tags: [Revision Admin]
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
 */
router.post("/quiz/generate", authorize(Role.STUDENT, Role.ADMIN), generateStudentQuiz);

/**
 * @swagger
 * /api/revision/quiz/submit:
 *   post:
 *     summary: "[Student] Nộp kết quả quiz và nhận XP"
 *     tags: [Revision Student]
 */
router.post("/quiz/submit", authorize(Role.STUDENT, Role.ADMIN), submitStudentQuiz);

/**
 * @swagger
 * /api/revision/flashcards/get:
 *   post:
 *     summary: "[Student] Lấy bộ Flashcard theo chủ đề"
 *     tags: [Revision Student]
 */
router.post("/flashcards/get", authorize(Role.STUDENT, Role.ADMIN), getStudentFlashcards);

/**
 * @swagger
 * /api/revision/mindmap/get:
 *   post:
 *     summary: "[Student] Lấy Mindmap theo chủ đề"
 *     tags: [Revision Student]
 */
router.post("/mindmap/get", authorize(Role.STUDENT, Role.ADMIN), getStudentMindmap);

export default router;
