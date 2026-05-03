# 🚀 Gia Sư AI KHTN (AI Tutor cho Khoa Học Tự Nhiên)

Chào mừng đến với dự án **Gia Sư AI KHTN** – Một nền tảng học tập thông minh dựa trên trí tuệ nhân tạo, được thiết kế đặc biệt cho học sinh môn Khoa học tự nhiên (Vật lý, Hóa học, Sinh học) cấp THCS. Dự án cung cấp môi trường tự học linh hoạt, sinh động kết hợp với các công cụ ôn tập tự động và thi đấu thời gian thực.

![Trạng thái](https://img.shields.io/badge/Trạng_thái-Hoàn_thiện_&_Sẵn_sàng_Deploy-success)
![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite_%7C_Tailwind-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js_%7C_Express_%7C_Prisma-green)
![AI](https://img.shields.io/badge/AI_Engine-Google_Gemini-orange)

---

## ✨ Tính Năng Nổi Bật

### 1. 🤖 AI Chat & RAG (Retrieval-Augmented Generation)
- **Chatbot Gia sư**: Trực tiếp giải đáp các thắc mắc môn KHTN với ngữ cảnh bám sát kiến thức THCS.
- **Tích hợp RAG**: Giáo viên có thể upload tài liệu (PDF, Word, TXT) vào "Ngân hàng tri thức". AI sẽ đọc, nhúng vector (embedding) và trả lời học sinh **dựa trên tài liệu gốc của giáo viên**, giúp tránh việc AI "bịa" kiến thức.

### 2. 📚 Ôn Tập Thông Minh (Revision)
- **Tự động sinh Quiz**: Sinh bài tập trắc nghiệm đa cấp độ (Nhận biết, Thông hiểu, Vận dụng) với thời gian đếm ngược.
- **Flashcards Sinh động**: Tạo thẻ ghi nhớ lật mặt giúp học thuộc khái niệm, phương trình hóa học hoặc công thức vật lý.
- **Mindmap (Sơ đồ tư duy)**: AI tự động phân tích chủ đề bài học và vẽ sơ đồ tư duy trực quan (Mermaid).

### 3. ⚔️ Đấu Trường Trí Tuệ (Arena)
- **PvP & PvE Real-time**: Sử dụng WebSockets (`Socket.IO`) để tổ chức các trận đấu trực tuyến 1vs1 giữa các học sinh (hoặc học sinh vs AI) dựa trên bộ câu hỏi tự sinh ngẫu nhiên.
- **Tính điểm tốc độ**: Cơ chế tính 10 điểm cho câu trả lời đúng và thêm điểm thưởng (5 điểm) cho người trả lời nhanh hơn.
- **Bảng xếp hạng (Leaderboard)**: Lưu trữ điểm XP (Kinh nghiệm) vào Database và vinh danh chiến binh xuất sắc nhất toàn trường hoặc theo khối lớp.

### 4. 👥 Quản Lý Học Tập (Dành cho Giáo viên)
- Quản lý học sinh (Thêm, sửa, xóa, reset mật khẩu).
- Quản lý lớp học và theo dõi thống kê hiệu suất học tập.
- Dashboard trực quan quản lý Prompt Hệ thống và Ngân hàng Tri thức RAG.

---

## 🛠 Công Nghệ Sử Dụng

**Frontend:**
- **Core**: React 19, Vite, TypeScript.
- **UI/UX**: TailwindCSS v4, Radix UI (Headless Components), Motion (Framer Motion cho animations).
- **Router**: React Router v7.
- **Tính năng mở rộng**: `canvas-confetti` (hiệu ứng pháo hoa), `lucide-react` (icon), `react-markdown` & `katex` (hiển thị công thức Toán/Hóa).

**Backend:**
- **Core**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL kết hợp Prisma ORM.
- **Authentication**: JWT (Access Token & Refresh Token lưu qua cookies & body), bcryptjs.
- **Real-time**: Socket.IO.
- **AI Integration**: `@google/genai` (Google Gemini API).

**Deploy & DevOps:**
- **Frontend**: Vercel.
- **Backend & DB**: Render (PostgreSQL).
- **API Docs**: Swagger UI (Tích hợp sẵn tại `/api-docs`).

---

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

### 1. Yêu cầu hệ thống
- **Node.js** (Phiên bản >= 18.x)
- **PostgreSQL** (Cài đặt local hoặc sử dụng dịch vụ DB cloud)
- Tài khoản và API Key của **Google Gemini** (Google AI Studio).

### 2. Cài đặt Backend
```bash
cd server
npm install

# Tạo file .env và điền các cấu hình
cp .env.example .env
# Chỉnh sửa file .env: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY...

# Đồng bộ Database Schema (Tạo bảng)
npx prisma db push

# Chạy server ở chế độ dev
npm run dev
```
*Backend sẽ chạy tại `http://localhost:3001`.*  
*Xem tài liệu API tại: `http://localhost:3001/api-docs`.*

### 3. Cài đặt Frontend
```bash
cd client
npm install

# Tạo file .env và khai báo đường dẫn tới API
echo "VITE_API_URL=http://localhost:3001" > .env

# Chạy frontend dev server
npm run dev
```
*Frontend sẽ chạy tại `http://localhost:5173`.*

---

## 📂 Cấu Trúc Thư Mục

```text
gia-su-ai-khtn/
├── client/                 # Mã nguồn Frontend (React)
│   ├── src/
│   │   ├── app/            # Cấu hình React Router, Layout chính
│   │   ├── features/       # Chia module chức năng (arena, auth, chat, revision, admin...)
│   │   ├── components/     # UI Components dùng chung (Button, Input, Card...)
│   │   ├── hooks/          # React Custom Hooks
│   │   ├── lib/            # Tiện ích (API Request, Fetcher, Utils)
│   │   └── ...
│   └── package.json
│
├── server/                 # Mã nguồn Backend (Node.js/Express)
│   ├── controllers/        # Xử lý logic Request/Response
│   ├── services/           # Xử lý logic nghiệp vụ lõi (AI, Database)
│   ├── routes/             # Định tuyến API
│   ├── sockets/            # Xử lý sự kiện Socket.io (Đấu trường Arena)
│   ├── prisma/             # Schema Model Database
│   ├── config/             # Cấu hình Swagger, DB...
│   └── ...
│
├── render.yaml             # Blueprint tự động Deploy lên hệ thống Render
└── README.md               # Tài liệu dự án
```

---

## 🔒 Phân Quyền Hệ Thống
Hệ thống sử dụng model `User` với trường `role` gồm 3 cấp độ:
- **`STUDENT`**: Trải nghiệm các tính năng Chat, Ôn tập và Đấu trường.
- **`TEACHER`**: Quản lý lớp học, học sinh, xem kết quả, tải lên tài liệu RAG.
- **`ADMIN`**: Toàn quyền, bao gồm cấu hình các Prompt hệ thống của AI.

---

> **Phát triển bởi team ERICSS / Dự án Ứng dụng AI trong Giáo Dục.**  
> *Sứ mệnh: Giúp học sinh học tập bộ môn Khoa học Tự nhiên một cách thông minh, chủ động và đầy cảm hứng.*
