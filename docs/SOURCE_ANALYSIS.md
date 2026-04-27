# Phân Tích Cấu Trúc Source Code - Dự Án "Gia Sư AI KHTN"

Tài liệu này cung cấp cái nhìn tổng quan về cấu trúc mã nguồn hiện tại của dự án "Gia Sư AI KHTN", công nghệ đang sử dụng, luồng hoạt động, các vấn đề cần cải thiện và định hướng tái cấu trúc (refactoring) để dự án đạt chuẩn chuyên nghiệp và hoạt động ổn định hơn.

---

## 1. Tính Năng Hiện Tại Của Dự Án
Dự án được xây dựng dưới dạng một ứng dụng web Single Page Application (SPA) với các tính năng chính hướng tới học sinh THCS (cụ thể là THCS Phước Tân 3):

- **Xác thực người dùng (Auth):** Học sinh đăng nhập bằng Tên và Mật khẩu (thông qua Firebase Auth Anonymous/Custom hoặc lưu trữ trực tiếp thông tin vào DB để giữ UID cố định).
- **Trợ lý học tập (Chat AI):** Giao tiếp với AI (Gemini) để giải đáp thắc mắc môn KHTN. AI được cấu hình để chỉ trả lời trong phạm vi sách "Chân trời sáng tạo".
- **Ôn tập (Quiz/Assessment):** Chức năng trắc nghiệm ôn tập kiến thức.
- **Đấu trường trí tuệ (Arena):** Chế độ chơi nhiều người (Multiplayer) thời gian thực, cho phép các học sinh thách đấu với nhau.
- **Hệ thống Gamification:** Tích lũy điểm kinh nghiệm (XP), thăng cấp (Tập sự -> Bác học), chuỗi ngày học (Streak), và Bảng xếp hạng (Leaderboard) toàn trường.
- **Bảng điều khiển Giáo viên (Teacher Panel):** Khu vực dành riêng cho quản trị viên (Cô giáo) để cấu hình (VD: đổi logo trường) và quản lý lớp học.
- **Đọc tài liệu:** Hỗ trợ trích xuất văn bản từ PDF, Word (`.docx`) để cung cấp ngữ cảnh cho AI.

---

## 2. Công Nghệ Sử Dụng (Tech Stack)

### Frontend (FE)
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4, thư viện icon `lucide-react`.
- **Animation:** `motion` (Framer Motion).
- **Markdown & Math rendering:** `react-markdown`, `rehype-katex`, `remark-math` (để hiển thị công thức Toán/Hóa chuẩn LaTeX).

### Backend (BE)
- **Framework:** Node.js + Express
- **Realtime / Multiplayer:** Socket.io (Xử lý ghép cặp matchmaking, challenge, và logic tính điểm trong Đấu trường).
- **Xử lý file:** `pdf-parse`, `mammoth` (Dùng để đọc file PDF, Word tải lên từ FE và trả về text).

### Database (DB) & Dịch vụ ngoài (BaaS)
- **Database & Auth:** Firebase (Firestore để lưu trữ user, leaderboard, config; Firebase Auth cho đăng nhập; Firebase Storage cho avatar).
- **AI Engine:** Google Gemini API (`@google/genai`).

---

## 3. Luồng Hoạt Động Kiến Trúc (Architecture Flow)

Kiến trúc hiện tại đang ở dạng **Hybrid (Lai) giữa BaaS (Backend-as-a-Service) và Traditional Server**:

1. **Frontend <-> Database (Firebase):**
   - Hầu hết logic đọc/ghi dữ liệu (Lấy thông tin học sinh, cập nhật XP, load Bảng xếp hạng) được Frontend gọi **trực tiếp** tới Firebase Firestore (`src/lib/firebase.ts`).
2. **Frontend <-> AI (Gemini):**
   - Frontend dường như đang gọi trực tiếp tới Google Gemini API (`src/lib/gemini.ts`) để chat.
3. **Frontend <-> Backend (Node.js/Express):**
   - **Xử lý File (`/api/extract-text`):** Khi học sinh upload file PDF/Docx, FE gửi file base64 lên BE. BE dùng thư viện Node.js để đọc chữ rồi trả text về FE để đưa vào Prompt AI.
   - **Đấu trường (Socket.io):** FE kết nối socket tới BE. BE lưu trữ trạng thái người chơi, phòng đấu (battles), và tính điểm hoàn toàn trên bộ nhớ tạm (In-memory RAM) của server.

---

## 4. Các Điểm Yếu Cần Cải Thiện (Để Hoạt Động Ổn Định)

Mặc dù tính năng khá đầy đủ, nhưng cấu trúc source hiện tại mang tính "chắp vá" và POC (Proof of Concept) nhiều hơn là một dự án Production. Để ổn định, cần giải quyết các vấn đề sau:

1. **Rủi ro bảo mật (Security Risk) với AI API Keys:**
   - Nếu gọi Gemini API từ Frontend, API Key sẽ bị lộ trong source code của trình duyệt. Bất kỳ ai cũng có thể lấy key này đem xài cho mục đích khác.
   - **Cách khắc phục:** Chuyển toàn bộ logic gọi Gemini API về Backend (Express). Frontend chỉ việc gọi API của Backend.
2. **Cấu trúc FE quá nguyên khối (Monolithic App.tsx):**
   - File `App.tsx` có dung lượng rất lớn (gần 40KB, >700 dòng code), gánh quá nhiều trách nhiệm: từ Auth, State quản lý user, đến hiển thị Header, Sidebar, và chứa tất cả giao diện Chat, Quiz, Arena.
   - Việc này gây khó khăn khi bảo trì, dễ sinh bug và làm chậm quá trình render (re-render nhiều).
   - Không có Router rõ ràng (Đang dùng biến state `activeTab` để chuyển trang).
3. **Quản lý Trạng thái (State Management) kém hiệu quả:**
   - Đang truyền props qua nhiều tầng (Prop drilling) hoặc gom hết vào state của `App.tsx`.
4. **Backend State không mở rộng được (Scalability):**
   - Socket.io trên `server.ts` đang lưu `players`, `matchmakingQueue` vào biến `Map` và `Array` trong RAM. Nếu server bị crash hoặc restart, mọi tiến trình trận đấu sẽ mất hết. Nếu deploy lên nhiều server (Scale out), các server sẽ không đồng bộ được trận đấu với nhau.
5. **Logic Database phân mảnh:**
   - FE gọi Firebase quá nhiều chỗ khiến việc kiểm soát quyền (Security Rules) ở Firestore trở nên phức tạp và nguy hiểm nếu học sinh cố tình hack (VD: gửi request tự cộng thêm cho mình 10,000 XP).

---

## 5. Định Hướng Tái Cấu Trúc Tổng Thể (Refactoring Strategy)

Để dự án trở thành một ứng dụng chuẩn mực, chuyên nghiệp và sẵn sàng mở rộng, tôi đề xuất refactor toàn bộ theo hướng kiến trúc **Client-Server rõ ràng** (hoặc Backend-BFF - Backend for Frontend):

### Bước 1: Chuẩn hóa lại Backend (Node.js Express)
Chuyển Backend thành "Trái tim" của hệ thống thay vì chỉ đóng vai trò phụ.
- **Tạo các API Routes rõ ràng:**
  - `POST /api/auth/login` (Xác thực user bằng Firebase Admin SDK).
  - `POST /api/chat` (Nhận tin nhắn, bọc Prompt chuẩn của sách Chân Trời Sáng Tạo, gọi sang Gemini, trả về FE).
  - `POST /api/quiz/generate` (Tạo câu hỏi).
- **Lưu trữ State Đấu trường:** Tạm thời vẫn có thể dùng RAM nếu lượng user nhỏ (chỉ 1 trường), nhưng cần tách file socket ra khỏi `server.ts` thành thư mục `src/sockets/arenaHandler.ts`.
- **Kiểm soát XP (Cheat Prevention):** Việc cộng XP không được phép thực hiện từ FE (FE gọi Firebase update). FE chỉ được phép báo cho BE (VD: trả lời đúng câu hỏi), BE sẽ kiểm tra và BE là nơi gọi update Firestore để cộng điểm.

### Bước 2: Tái cấu trúc Frontend (React + Vite)
Đập bỏ cấu trúc Tab trong `App.tsx` và xây dựng theo chuẩn:
- Áp dụng **React Router DOM** (để có URL rõ ràng: `/chat`, `/arena`, `/quiz`, `/teacher`).
- Áp dụng **Zustand** hoặc **Redux Toolkit** để quản lý Global State (Thông tin user, số XP, token).
- **Cấu trúc thư mục mới đề xuất cho FE:**
  ```text
  src/
  ├── assets/          # Hình ảnh, font chữ
  ├── components/      # Các component dùng chung (Button, Modal, Input)
  ├── features/        # Phân chia theo tính năng (chat, arena, quiz, teacher)
  │   ├── chat/        # Chứa components, hooks, API calls của Chat
  │   ├── arena/       # Chứa components, hooks, socket logic của Arena
  │   └── ...
  ├── layouts/         # Bố cục trang (MainLayout có Sidebar, Header)
  ├── pages/           # Các trang chính tương ứng với Route
  ├── store/           # Zustand/Redux store
  ├── lib/             # Cấu hình Axios, Socket, Utils
  └── App.tsx          # Chỉ chứa Provider và Router setup
  ```

### Bước 3: Chuẩn hóa UI/UX và Prompt theo Quy tắc
- Tích hợp chặt chẽ quy tắc (như file `AGENTS.md`, `GEMINI.md`) vào System Prompt của BE để đảm bảo AI luôn trả lời bằng cấu trúc Markdown, có dấu `$` cho LaTeX và chỉ dùng kiến thức của "Chân trời sáng tạo".
- Áp dụng Design System đồng nhất trên FE.

### Tổng kết:
Dự án hiện tại là một bản nháp rất tốt với ý tưởng xuất sắc (có cả gamification và multiplayer). Tuy nhiên, để đưa vào sử dụng thực tế cho học sinh mà không bị lag, crash hay hack điểm, việc refactor theo định hướng tách bạch **Frontend (View)** - **Backend (Logic/AI/Socket)** - **Firebase (DB)** như trên là hoàn toàn bắt buộc.
