import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gia Sư AI KHTN - API Documentation",
      version: "1.0.0",
      description:
        "API Backend cho ứng dụng Gia Sư AI KHTN - Trường THCS Phước Tân 3. " +
        "Hệ thống hỗ trợ học sinh ôn tập môn Khoa học tự nhiên bằng AI (Gemini), " +
        "bao gồm các chức năng: Chat AI, Tạo Quiz, Flashcards, Mindmap, Đấu trường trí tuệ.",
      contact: {
        name: "Gia sư AI KHTN",
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Dán access token vào đây theo dạng Bearer token để gọi các API cần xác thực.",
        },
      },
    },
    servers: [
      {
        url: "http://localhost:{port}",
        description: "Local Development Server",
        variables: {
          port: {
            default: "3001",
          },
        },
      },
    ],
    tags: [
      { name: "Health", description: "Kiểm tra trạng thái server" },
      { name: "Auth", description: "Xác thực và quản lý phiên đăng nhập" },
      { name: "Users - Hồ sơ", description: "Quản lý hồ sơ cá nhân" },
      { name: "Users - Quản lý", description: "Quản lý tài khoản (Admin)" },
      { name: "Classes - Lớp học", description: "Quản lý lớp học và học sinh" },
      { name: "System Configs", description: "Cấu hình hệ thống chung" },
      { name: "Knowledge Base", description: "Quản lý tài liệu RAG" },
      { name: "Chat", description: "Quản lý phiên chat AI" },
      { name: "Revision", description: "Quản lý ngân hàng câu hỏi, flashcards, mindmap" },
    ],
  },
  apis: ["./routes/*.ts", "./controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
