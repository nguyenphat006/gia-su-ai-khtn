import { Router } from "express";
import { Role } from "@prisma/client";
import multer from "multer";
import {
  listUsers,
  getUser,
  createNewUser,
  updateUser,
  removeUsers,
  updateProfile,
  importUsersFromExcel,
  importUsersFromJson,
  exportUsersToExcel,
  generateMockData,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
// Multer: nhận file Excel upload vào RAM (không lưu disk)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
// IMPORT / EXPORT / GENERATE — PHẢI đặt TRƯỚC /:id
// ========================================

/**
 * @swagger
 * /api/users/import-excel:
 *   post:
 *     summary: Import danh sách học sinh từ file Excel (.xlsx)
 *     tags: [Users - Import/Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel (.xlsx) chứa danh sách học sinh
 *     responses:
 *       200:
 *         description: Kết quả import
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                   description: Số user tạo thành công
 *                 errors:
 *                   type: array
 *                   description: Danh sách lỗi (nếu có)
 */
router.post("/import-excel", authenticate, authorize(Role.ADMIN), upload.single("file"), importUsersFromExcel);

/**
 * @swagger
 * /api/users/batch-import:
 *   post:
 *     summary: Import danh sách học sinh từ JSON array
 *     tags: [Users - Import/Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [users]
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     password:
 *                       type: string
 *                       default: "123456"
 *                     studentCode:
 *                       type: string
 *                     grade:
 *                       type: integer
 *                     role:
 *                       type: string
 *                       default: STUDENT
 *     responses:
 *       200:
 *         description: Kết quả import
 */
router.post("/batch-import", authenticate, authorize(Role.ADMIN), importUsersFromJson);

/**
 * @swagger
 * /api/users/export-excel:
 *   get:
 *     summary: Xuất danh sách người dùng ra file Excel (.xlsx)
 *     tags: [Users - Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, TEACHER, ADMIN]
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File Excel tải xuống
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/export-excel", authenticate, authorize(Role.ADMIN), exportUsersToExcel);

/**
 * @swagger
 * /api/users/generate-mock:
 *   post:
 *     summary: Sinh dữ liệu học sinh giả lập bằng AI (Google Gemini)
 *     tags: [Users - Import/Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [count]
 *             properties:
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 10
 *                 description: Số lượng học sinh cần tạo
 *               classId:
 *                 type: string
 *                 description: Gán vào lớp học cụ thể (tùy chọn)
 *               grade:
 *                 type: integer
 *                 minimum: 6
 *                 maximum: 9
 *                 description: Khối lớp (tùy chọn)
 *               saveToDb:
 *                 type: boolean
 *                 default: false
 *                 description: Lưu thẳng vào Database luôn (true) hay chỉ preview (false)
 *     responses:
 *       200:
 *         description: Danh sách học sinh do AI tạo
 */
router.post("/generate-mock", authenticate, authorize(Role.ADMIN), generateMockData);

// ========================================
// CRUD — Chỉ dành cho Admin/Teacher
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
 *               grade:
 *                 type: integer
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
router.get("/", authenticate, authorize(Role.ADMIN, Role.TEACHER), listUsers);
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
