# Bối Cảnh Dự Án (Project Context) - Gia Sư AI KHTN

Tài liệu này đóng vai trò là "Bản đồ kiến trúc" (Architecture Map) của dự án. Mọi AI Agent tham gia phát triển dự án này cần đọc kỹ tài liệu này trước khi chỉnh sửa code để tránh phá vỡ kiến trúc.

## 1. Tổng Quan Dự Án (Overview)
- **Tên dự án:** Gia Sư AI KHTN - Trường THCS Phước Tân 3.
- **Mục tiêu:** Xây dựng hệ thống học tập thông minh bằng AI (Gemini) giúp học sinh ôn tập môn Khoa học Tự nhiên thông qua Chat, Quiz, Flashcards, Mindmap, và tính năng Gamification (Bảng xếp hạng, Cấp độ, Đấu trường).
- **Trạng thái hiện tại:** Đang trong giai đoạn **Refactoring (Tái cấu trúc)**. Chuyển đổi từ mô hình Frontend-Nguyên-Khối (Frontend gọi trực tiếp Firebase/Gemini) sang mô hình Client-Server chuẩn mực để đảm bảo bảo mật, dễ mở rộng (Scale-up) và sẵn sàng tích hợp các tính năng Multiplayer lớn (Redis).

---

## 2. Kiến Trúc Frontend (Client-side)
- **Công nghệ chính:** React, Vite, TypeScript, TailwindCSS.
- **Thư mục:** Code nằm rải rác ở gốc dự án (`src/`).
- **Nhiệm vụ:**
  - Cung cấp giao diện người dùng.
  - Quản lý đăng nhập (Firebase Auth).
  - Giao tiếp với Backend thông qua REST API (để lấy dữ liệu, chat AI) và Socket.io (để chơi Đấu trường).
- **Lưu ý trong giai đoạn Refactoring:** Các file trong `src/lib/` (như `gemini.ts`, `firebase.ts`) đang dần bị loại bỏ/sửa đổi. FE không được phép chứa `GEMINI_API_KEY` hay trực tiếp ghi dữ liệu vào Database nữa. Mọi thao tác phải gọi qua API của Backend.

---

## 3. Kiến Trúc Backend (Server-side)
- **Công nghệ chính:** Node.js, Express, TypeScript.
- **Thư mục độc lập:** Toàn bộ code backend nằm gói gọn trong thư mục `/server/`.
- **Mô hình kiến trúc:** **Layered Architecture** (Kiến trúc phân tầng).
  - `server/routes/`: Định nghĩa các API endpoint (VD: `/api/users`, `/api/ai/chat`). Tích hợp Swagger OpenAPI để test.
  - `server/controllers/`: Nhận request từ FE, gọi Service xử lý, và trả về Response.
  - `server/services/`: Chứa toàn bộ "Business Logic". (VD: Hàm gọi Google Gemini, hàm cộng điểm XP).
  - `server/config/`: Cấu hình kết nối DB, Firebase Admin.
  - `server/sockets/`: Xử lý kết nối Real-time bằng Socket.io cho tính năng Đấu trường.
  - `server/middleware/`: Xử lý lỗi tập trung (`error-handler`).

---

## 4. Kiến Trúc Cơ Sở Dữ Liệu (Database Architecture)
Dự án sử dụng cơ chế lai (Hybrid) để tối ưu chi phí và hiệu suất.

### A. Authentication (Đăng nhập/Xác thực)
- **Sử dụng:** Firebase Authentication.
- **Cách hoạt động:** Frontend cho học sinh đăng nhập bằng Email/Password qua Firebase -> Lấy UID -> Truyền UID xuống Backend qua các API.

### B. Application Data (Dữ liệu ứng dụng chính)
- **Sử dụng:** PostgreSQL + Prisma ORM.
- **Schema chính (tham khảo `server/prisma/schema.prisma`):**
  - `User`: Lưu thông tin học sinh (link với `firebaseUid`).
  - `UserStats`: Lưu tổng điểm (XP) và chuỗi ngày học tập (Streak) để truy vấn Bảng xếp hạng siêu tốc.
  - `XpLog`: Lịch sử giao dịch điểm số (Audit Log) để truy vết học sinh lấy điểm từ đâu (VD: +50 XP từ Quiz).
  - `Class`: Định danh lớp học (VD: 6A, 9B).

### C. Matchmaking & Real-time (Đấu trường) - *Giai đoạn sau*
- **Sử dụng (Tương lai):** Redis.
- **Mục tiêu:** Quản lý hàng đợi ghép trận (Queue) thay vì dùng RAM, giúp hệ thống không bị crash khi có hàng ngàn học sinh cùng thi đấu trên nhiều máy chủ khác nhau.

---

## 5. Danh sách Môi trường (Environment Variables)
Backend sử dụng các biến môi trường sau (Nằm trong `server/.env`):
- `PORT`: Cổng chạy server (thường là 3001).
- `GEMINI_API_KEY`: API Key để gọi AI. Nằm hoàn toàn ở Backend để bảo mật.
- `DATABASE_URL`: Chuỗi kết nối PostgreSQL (dùng cho Prisma).
- `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL`: Để Backend giao tiếp với Firebase Auth bằng quyền Admin (Admin SDK).

---

## 6. Hướng Dẫn Tác Nghiệp Dành Cho AI Agent
1. **Tuyệt đối tuân thủ phân tầng:** Khi tạo một API mới, phải tạo Route -> Controller -> Service riêng biệt. Không nhét toàn bộ logic vào Controller.
2. **Bảo mật:** Không bao giờ đưa các khóa bí mật (Secret Keys) xuống code Frontend.
3. **Database:** Mọi thao tác đọc/ghi cơ sở dữ liệu phải dùng Prisma Client (`server/config/db.ts`), KHÔNG sử dụng Firebase Firestore cũ của Frontend.
4. **Tiêu chuẩn UI:** Frontend sử dụng Tailwind, phải bám sát ngôn ngữ thiết kế "Gamification" (vui nhộn, màu sắc rõ ràng).
5. **Nội dung giáo dục:** Mọi Prompt AI phải nhắc nhở Gemini chỉ dùng kiến thức trong SGK "Chân trời sáng tạo" cấp THCS.
