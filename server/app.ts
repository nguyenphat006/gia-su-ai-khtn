import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middleware/error-handler.js";
import apiRoutes from "./routes/api.routes.js";
import { setupArenaSockets } from "./sockets/arenaHandler.js";

export async function buildApp() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // ========================
  // MIDDLEWARE
  // ========================

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
  app.use(cors({ 
    origin: allowedOrigins,
    credentials: true 
  }));

  // Cookie parser
  app.use(cookieParser());

  // Body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Request logging (đơn giản)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`
      );
    });
    next();
  });

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
