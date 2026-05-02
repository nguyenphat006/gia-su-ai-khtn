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
  getStudentMindmap,
  evaluateStudentEssay
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
 *         name: grade
 *         schema: { type: integer }
 *         example: 6
 *       - in: query
 *         name: topic
 *         schema: { type: string }
 *         example: "Năng lượng"
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [EASY, MEDIUM, HARD] }
 *         example: "MEDIUM"
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [MULTIPLE_CHOICE, ESSAY] }
 *         example: "MULTIPLE_CHOICE"
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     questions: { type: array, items: { type: object } }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer, example: 100 }
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 10 }
 *                         totalPages: { type: integer, example: 10 }
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
 *               grade: { type: integer, example: 6 }
 *               topic: { type: string, example: "Quang hợp" }
 *               type: { type: string, enum: [MULTIPLE_CHOICE, ESSAY], example: "MULTIPLE_CHOICE" }
 *               difficulty: { type: string, example: "Dễ" }
 *               content: { type: string, example: "Cơ quan nào thực hiện quang hợp?" }
 *               options: { type: array, items: { type: string }, example: ["Lá", "Rễ", "Thân", "Hoa"] }
 *               correctAnswer: { type: string, example: "Lá" }
 *               explanation: { type: string, example: "Lá chứa lục lạp để quang hợp." }
 *     responses:
 *       201: { description: "Tạo thành công" }
 *   delete:
 *     summary: "[Admin/Teacher] Xóa nhiều câu hỏi"
 *     tags: [Revision Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: { type: array, items: { type: string }, example: ["id-1", "id-2"] }
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic: { type: string, example: "Chủ đề mới" }
 *               content: { type: string, example: "Nội dung câu hỏi đã sửa" }
 *               isActive: { type: boolean, example: true }
 *               difficulty: { type: string, example: "Khó" }
 *               correctAnswer: { type: string, example: "Đáp án đúng" }
 *               explanation: { type: string, example: "Giải thích mới" }
 *     responses:
 *       200: { description: "Cập nhật thành công" }
 */
router.put("/questions/:id", authorize(Role.ADMIN, Role.TEACHER), updateQuestionBank);

/**
 * @swagger
 * /api/revision/flashcards:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách bộ Flashcard (Phân trang)"
 *     tags: [Revision Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: grade
 *         schema: { type: integer }
 *         example: 7
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     decks: { type: array, items: { type: object } }
 *                     pagination: { type: object }
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
 *               grade: { type: integer, example: 7 }
 *               topic: { type: string, example: "Tế bào" }
 *               title: { type: string, example: "Cấu tạo tế bào" }
 *               cards: 
 *                 type: array
 *                 items: 
 *                   type: object
 *                   properties: 
 *                     front: {type: string}
 *                     back: {type: string}
 *                 example: [{ front: "DNA là gì?", back: "Vật chất di truyền" }]
 *     responses:
 *       201: { description: "Tạo thành công" }
 *   delete:
 *     summary: "[Admin/Teacher] Xóa nhiều bộ Flashcard"
 *     tags: [Revision Admin]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: { type: array, items: { type: string }, example: ["id-1"] }
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               cards: { type: array, items: { type: object } }
 *     responses:
 *       200: { description: "Cập nhật thành công" }
 */
router.put("/flashcards/:id", authorize(Role.ADMIN, Role.TEACHER), updateFlashcard);

/**
 * @swagger
 * /api/revision/mindmaps:
 *   get:
 *     summary: "[Admin/Teacher] Lấy danh sách Sơ đồ tư duy (Phân trang)"
 *     tags: [Revision Admin]
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     mindmaps: { type: array, items: { type: object } }
 *                     pagination: { type: object }
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
 *             properties:
 *               grade: { type: integer, example: 8 }
 *               topic: { type: string, example: "Lực" }
 *               title: { type: string, example: "Sơ đồ các loại lực" }
 *               markdown: { type: string, example: "graph TD; A-->B;" }
 *     responses:
 *       201: { description: "Tạo thành công" }
 *   delete:
 *     summary: "[Admin/Teacher] Xóa Sơ đồ tư duy"
 *     tags: [Revision Admin]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: { type: array, items: { type: string }, example: ["id-1"] }
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               markdown: { type: string }
 */
router.put("/mindmaps/:id", authorize(Role.ADMIN, Role.TEACHER), updateMindmap);

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
 *               type: { type: string, enum: [QUIZ, FLASHCARD, MINDMAP], example: "QUIZ" }
 *               grade: { type: integer, example: 6 }
 *               topic: { type: string, example: "Quang hợp" }
 *               count: { type: integer, example: 5 }
 *     responses:
 *       200:
 *         description: "Thành công"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data: { type: object }
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic]
 *             properties:
 *               grade: { type: integer, example: 6 }
 *               topic: { type: string, example: "Hệ mặt trời" }
 *               type: { type: string, enum: ["Trắc nghiệm", "Tự luận", "Trắc nghiệm & Tự luận"], example: "Trắc nghiệm" }
 *               limit: { type: integer, example: 5 }
 */
router.post("/quiz/generate", authorize(Role.STUDENT, Role.ADMIN), generateStudentQuiz);

/**
 * @swagger
 * /api/revision/quiz/submit:
 *   post:
 *     summary: "[Student] Nộp kết quả quiz và nhận XP"
 *     tags: [Revision Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quizType, totalQuestions, correctCount]
 *             properties:
 *               quizType: { type: string, example: "CHINH_PHUC" }
 *               totalQuestions: { type: integer, example: 5 }
 *               correctCount: { type: integer, example: 4 }
 */
router.post("/quiz/submit", authorize(Role.STUDENT, Role.ADMIN), submitStudentQuiz);

/**
 * @swagger
 * /api/revision/quiz/grade-essay:
 *   post:
 *     summary: "[Student] Chấm điểm bài tự luận bằng AI"
 *     tags: [Revision Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string, example: "Quang hợp là gì?" }
 *               answer: { type: string, example: "Là quá trình cây xanh tạo chất hữu cơ từ CO2 và nước nhờ ánh sáng." }
 *               image: { type: object, properties: { data: { type: string }, mimeType: { type: string } } }
 */
router.post("/quiz/grade-essay", authorize(Role.STUDENT, Role.ADMIN), evaluateStudentEssay);

/**
 * @swagger
 * /api/revision/flashcards/get:
 *   post:
 *     summary: "[Student] Lấy bộ Flashcard theo chủ đề"
 *     tags: [Revision Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic]
 *             properties:
 *               grade: { type: integer, example: 7 }
 *               topic: { type: string, example: "Tế bào" }
 */
router.post("/flashcards/get", authorize(Role.STUDENT, Role.ADMIN), getStudentFlashcards);

/**
 * @swagger
 * /api/revision/mindmap/get:
 *   post:
 *     summary: "[Student] Lấy Mindmap theo chủ đề"
 *     tags: [Revision Student]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade, topic]
 *             properties:
 *               grade: { type: integer, example: 8 }
 *               topic: { type: string, example: "Lực ma sát" }
 */
router.post("/mindmap/get", authorize(Role.STUDENT, Role.ADMIN), getStudentMindmap);

export default router;
