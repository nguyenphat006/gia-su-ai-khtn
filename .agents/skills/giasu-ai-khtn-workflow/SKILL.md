---
name: giasu-ai-khtn-workflow
description: Các quy tắc cốt lõi (RULES) và luồng làm việc (WORKFLOW) chuẩn mực cho dự án Gia Sư AI KHTN. Bắt buộc phải tham khảo khi code mới, debug hoặc cấu trúc lại hệ thống để đảm bảo sự thống nhất toàn diện giữa Client và Server.
---

# Gia Sư AI KHTN - Rules & Workflow

Tài liệu này định nghĩa cấu trúc, công nghệ và các quy tắc bắt buộc khi phát triển dự án Gia Sư AI KHTN.

## 1. Công nghệ & Cấu trúc (Tech Stack & Structure)

Dự án là một Monorepo được chia làm hai phần chính:

*   **Server (`/server`)**: Node.js + Express + Prisma + PostgreSQL + Google GenAI.
    *   **Architecture**: Layered Architecture (Routes -> Controllers -> Services).
    *   **Module System**: Sử dụng **ESM** (`type: "module"`). BẮT BUỘC phải thêm đuôi `.js` khi import file local (VD: `import { x } from "./user.service.js"`).
    *   **Database**: PostgreSQL. Luôn dùng Prisma làm ORM. Để đồng bộ schema, KHÔNG dùng `prisma migrate` trong giai đoạn dev (để tránh rác migration), hãy ưu tiên dùng `npx prisma db push`.
*   **Client (`/client`)**: React 19 + Vite + Tailwind CSS v4 + React Router v7.
    *   **Architecture**: Feature-based pattern (`src/features/...`), các module dùng chung để trong `src/components`, `src/hooks`, `src/lib`.
    *   **UI/UX**: Sử dụng Tailwind CSS. Hạn chế custom CSS unless needed. Dùng `lucide-react` cho icons.

## 2. Quy tắc Xác thực (Authentication Rules)

*   **Backend Flow**:
    *   Sử dụng JWT (Access Token & Refresh Token).
    *   **Bắt buộc**: Access Token và Refresh Token phải được gửi cho Client dưới dạng **httpOnly cookies** (với tùy chọn `secure`, `sameSite`, `path`).
    *   Không trả token trong body của JSON response.
    *   Có duy nhất 1 endpoint `/api/auth/login` cho mọi loại Role.
*   **Frontend Flow**:
    *   Axios/Fetch khi request API luôn phải truyền `credentials: "include"`.
    *   KHÔNG lưu token ở `localStorage`.
    *   State authentication được quản lý tại hook tập trung `useAuth.ts`.

## 3. Quy tắc API & Triển khai tính năng (API Rules)

Mỗi khi thêm một tính năng CRUD hay Logic mới, luôn phải tuân theo luồng sau:
1.  **Prisma Schema (`server/prisma/schema.prisma`)**: Cập nhật Model, chạy `npx prisma generate` và `npx prisma db push`.
2.  **Service (`server/services/*.service.ts`)**: Chứa business logic, truy xuất Prisma. Service KHÔNG nhận các object `req`, `res` của Express.
3.  **Controller (`server/controllers/*.controller.ts`)**: Lấy data từ request `req.body`, `req.query`, `req.params`. Gọi service, handle try/catch và trả về Response JSON.
4.  **Route (`server/routes/*.routes.ts`)**: Gắn controller vào route, thêm middleware authentication (`authenticate`) và authorization (`authorize(Role)`). Khai báo **Swagger Documentation** ngay trên route.
5.  **Client Service (`client/src/features/xxx/service.ts`)**: Khai báo interface (Type) và gọi fetch API.
6.  **Client UI**: Sử dụng các hooks/components để hiển thị dữ liệu từ Client Service.

## 4. Quy tắc Tích hợp AI (Gemini GenAI)

*   **Bảo mật**: Chỉ phía Server mới được gọi thư viện `@google/genai`. Client KHÔNG được lưu trữ hay gọi API key trực tiếp.
*   **Context & Prompting**:
    *   AI phải được cấp ngữ cảnh từ hệ thống sách giáo khoa KHTN Chân trời sáng tạo (ưu tiên qua RAG/Vector search nếu có).
    *   Luôn yêu cầu định dạng đầu ra chuẩn bằng cấu trúc Markdown và biểu thức Toán học phải bọc trong chuẩn LaTeX (`$...$` cho inline, `$$...$$` cho khối).
*   **Database Sync**: Mọi request và response từ AI phải được lưu vào bảng `ChatMessage` và `ChatSession` ở Server để truy xuất sau này.

## 5. Deployment Rules (Render)

*   Database sử dụng bản Free tier PostgreSQL (cần thận trọng không lạm dụng connection pool).
*   File `render.yaml` tự động lo quá trình build. Lệnh build phía backend cần chạy `npm install --include=dev` để có đủ môi trường chạy `prisma generate` & tsc.

## 6. Development Workflow (Cách AI làm việc với Dev)

Khi được yêu cầu phát triển một tính năng mới:
1.  **Phân tích (Analyze)**: Đọc file code cũ hoặc xem cấu trúc hiện tại (bằng `list_dir`, `view_file`).
2.  **Lên kế hoạch (Plan)**: Nếu có sự thay đổi kiến trúc lớn, tạo file `implementation_plan.md` ở root và chờ ý kiến người dùng.
3.  **Tách lớp (Decouple)**: Thực hiện từ DB -> Server Service -> Server Route -> Client Interface -> Client Logic -> Client UI.
4.  **Chống rác (Clean Code)**: Cố gắng refactor những file có chung chức năng, không để thừa biến hoặc function import mà không dùng đến.
