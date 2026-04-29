import { Router } from "express";
import authRoutes from "./auth.routes.js";
import aiRoutes from "./ai.routes.js";
import fileRoutes from "./file.routes.js";
import userRoutes from "./user.routes.js";
import classRoutes from "./class.routes.js";
import systemRoutes from "./system.routes.js";
import knowledgeRoutes from "./knowledge.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Kiểm tra trạng thái server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: "Gia sư AI KHTN API is running"
 *                 timestamp:
 *                   type: string
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Gia sư AI KHTN API is running",
    timestamp: new Date().toISOString(),
  });
});

// Gắn các nhóm API
router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/files", fileRoutes);
router.use("/users", userRoutes);
router.use("/classes", classRoutes);
router.use("/system", systemRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/chat", chatRoutes);

export default router;
