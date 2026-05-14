import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { activityLogger } from "./middleware/activity-logger.js";
import apiRoutes from "./routes/api.routes.js";
import { setupArenaSockets } from "./sockets/arenaHandler.js";
import { seedChallenges } from "./services/gamification.service.js";
import { ensureDefaultConfigs } from "./services/system.service.js";

export async function buildApp() {
  // Khởi tạo cấu hình & challenges mặc định
  ensureDefaultConfigs().catch(err => console.error("Lỗi khi khởi tạo cấu hình:", err));
  seedChallenges().catch(err => console.error("Lỗi khi seed challenges:", err));

  const app = express();
  app.set("trust proxy", 1);
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // ========================
  // MIDDLEWARE
  // ========================

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(s => s.trim()) || [];
  app.use(cors({ 
    origin: (origin, callback) => {
      // Cho phép requests không có origin (Swagger UI, curl, mobile apps)
      if (!origin) return callback(null, true);
      // Luôn cho phép chính domain backend và localhost
      if (origin.includes("onrender.com") || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("::1")) {
        return callback(null, true);
      }
      // Cho phép tất cả nếu chưa cấu hình ALLOWED_ORIGINS
      if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.error(`[CORS REJECTED] Origin: '${origin}' không nằm trong ALLOWED_ORIGINS:`, allowedOrigins);
      return callback(new Error("CORS không cho phép origin này."));
    },
    credentials: true 
  }));

  // Cookie parser
  app.use(cookieParser());

  // Activity logging (Database)
  app.use(activityLogger);

  // Body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ========================
  // SWAGGER UI
  // ========================
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Gia sư AI KHTN - API Docs",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  // ========================
  // API ROUTES
  // ========================
  app.use("/api", apiRoutes);

  // ========================
  // SOCKET.IO (Đấu trường)
  // ========================
  setupArenaSockets(io);

  // ========================
  // GLOBAL ERROR HANDLER
  // ========================
  app.use(errorHandler);

  return { app, httpServer, io };
}
