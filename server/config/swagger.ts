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
      { name: "AI - Chat", description: "Trợ lý học tập AI (Gemini)" },
      { name: "AI - Quiz", description: "Tạo đề thi/ôn tập bằng AI" },
      { name: "AI - Tools", description: "Flashcards, Mindmap, Phân tích" },
      { name: "File", description: "Trích xuất văn bản từ PDF/Word" },
      { name: "Classes - Lớp học", description: "Quản lý lớp học và học sinh" },
    ],
  },
  apis: ["./routes/*.ts", "./controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
