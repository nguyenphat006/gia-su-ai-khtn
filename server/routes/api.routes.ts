import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import classRoutes from "./class.routes.js";
import systemRoutes from "./system.routes.js";
import knowledgeRoutes from "./knowledge.routes.js";
import chatRoutes from "./chat.routes.js";
import revisionRoutes from "./revision.routes.js";
import arenaRoutes from "./arena.routes.js";

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
 *                   example: "2023-01-01T00:00:00.000Z"
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
router.use("/users", userRoutes);
router.use("/classes", classRoutes);
router.use("/system", systemRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/chat", chatRoutes);
router.use("/revision", revisionRoutes);
router.use("/arena", arenaRoutes);

export default router;
