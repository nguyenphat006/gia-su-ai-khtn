import "dotenv/config";
import { buildApp } from "./app.js";

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    const { httpServer } = await buildApp();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("");
      console.log("╔══════════════════════════════════════════════════╗");
      console.log("║  🚀  Gia sư AI KHTN - Backend Server            ║");
      console.log(`║  📡  API:      http://localhost:${PORT}/api/health  ║`);
      console.log(`║  📖  Swagger:  http://localhost:${PORT}/api-docs    ║`);
      console.log("║  🏫  Trường THCS Phước Tân 3                     ║");
      console.log("╚══════════════════════════════════════════════════╝");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
