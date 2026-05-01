# Kế hoạch Thiết kế API & Logic Module Ôn Tập (Revision)

Tài liệu này phân tích yêu cầu từ phía giáo viên và đề xuất cấu trúc Database, API cũng như các cải tiến Logic cốt lõi cho phân hệ "Ôn tập" (gồm: Chinh phục tri thức, Flashcard, Mindmap).

## 1. Phân tích & Gợi ý Cải tiến Logic cốt lõi

Theo yêu cầu, AI sẽ "tự tạo" nội dung dựa trên input của học sinh. Tuy nhiên, việc gọi API AI (Google Gemini) mỗi lần học sinh bấm nút sẽ đối mặt với 3 rủi ro lớn:
1. **Độ trễ cao:** Sinh 20 câu hỏi hoặc 1 sơ đồ tư duy phức tạp có thể mất 10-15 giây.
2. **Sai sót kiến thức:** AI có thể bị ảo giác (hallucinate), sinh ra câu hỏi sai hoặc đáp án sai. Điều này tối kỵ trong môi trường giáo dục.
3. **Chi phí token:** Hàng trăm học sinh gọi liên tục sẽ tiêu tốn tài nguyên rất nhanh.

**💡 Đề xuất Hybrid (Duyệt trước bởi Admin/Giáo viên):**
- Xây dựng **Ngân hàng dữ liệu (Bank)** lưu trữ sẵn Câu hỏi, Flashcard, Mindmap.
- **Phía Admin:** Giáo viên có một giao diện để nhập "Khối, Chủ đề" -> AI sinh ra dữ liệu -> Giáo viên kiểm duyệt/sửa chữa -> Lưu vào Database.
- **Phía Học sinh:** Khi học sinh chọn thông số, Server sẽ ưu tiên **random/bốc ngẫu nhiên** từ Database. Trải nghiệm sẽ nhanh như chớp và chính xác 100%. Nếu Database quá ít, mới kích hoạt AI sinh thêm Realtime.
- **Cải tiến tính năng Flashcard:** Áp dụng hệ thống thẻ "Đã thuộc" / "Chưa thuộc" (Spaced Repetition cơ bản).
- **Cải tiến tính năng Mindmap:** Render sơ đồ dưới định dạng thư viện Node (như `React Flow`) hoặc `Mermaid.js` để cho phép học sinh tương tác (Zoom in, Zoom out, Kéo thả), thay vì chỉ trả về 1 bức ảnh tĩnh.

---

## 2. Thiết kế Database (Bổ sung vào `schema.prisma`)

Chúng ta cần quản trị các thực thể mới để lưu trữ tri thức ôn tập:

```prisma
// Ngân hàng câu hỏi
model QuestionBank {
  id            String   @id @default(uuid())
  grade         String   // Khối/Lớp (VD: Lớp 6)
  topic         String   // Chủ đề (VD: Năng lượng)
  type          String   // Dạng: MULTIPLE_CHOICE, ESSAY
  difficulty    String   // Mức độ: EASY, MEDIUM, HARD
  content       String   // Nội dung câu hỏi
  options       Json?    // Array các đáp án (nếu là trắc nghiệm)
  correctAnswer String   // Đáp án đúng (hoặc keyword để chấm tự luận)
  explanation   String?  // Giải thích đáp án (AI sinh)
  isActive      Boolean  @default(true)
}

// Bộ Flashcard
model FlashcardDeck {
  id          String   @id @default(uuid())
  grade       String
  topic       String
  title       String
  cards       Json     // Array of { front: string, back: string }
  isActive    Boolean  @default(true)
}

// Sơ đồ tư duy
model MindmapData {
  id          String   @id @default(uuid())
  grade       String
  topic       String
  title       String
  markdown    String   // Code mermaid/Markmap sinh ra từ AI
  isActive    Boolean  @default(true)
}

// Lưu lịch sử bài thi
model QuizHistory {
  id              String   @id @default(uuid())
  userId          String
  quizType        String   // CHINH_PHUC hoặc FLASHCARD_QUIZ
  totalQuestions  Int
  correctCount    Int
  xpEarned        Int
  createdAt       DateTime @default(now())
}
```

---

## 3. Thiết kế Backend API

### A. Nhóm API Quản trị (Dành cho Admin/Giáo viên)
Các API này sẽ được thêm vào tính năng Admin UI trong tương lai để Giáo viên quản lý kho tài nguyên.
- `POST /api/admin/revision/generate` -> Gọi AI để sinh câu hỏi/flashcard/mindmap nháp.
- `POST /api/admin/revision/questions` -> Giáo viên duyệt và lưu câu hỏi vào Bank.
- `POST /api/admin/revision/flashcards` -> Lưu bộ Flashcard vào Bank.
- `POST /api/admin/revision/mindmaps` -> Lưu Mindmap vào Bank.

### B. Nhóm API Client (Dành cho Học sinh)

**1. Chinh phục tri thức (Quiz)**
- `POST /api/revision/quiz/generate`
  - *Payload:* `{ grade, topic, types[], difficulties[], limit }`
  - *Logic:* Truy vấn vào `QuestionBank` lấy random các câu hỏi phù hợp. Nếu không đủ, gọi AI sinh bù (Stream response). Trả về danh sách câu hỏi.
- `POST /api/revision/quiz/submit`
  - *Payload:* `{ questionId, studentAnswer, timeTaken }`
  - *Logic:* 
    - Nếu trắc nghiệm: check đáp án trong DB.
    - Nếu tự luận: Gọi AI chấm điểm và nhận xét dựa trên `correctAnswer` keyword.
    - Cộng 10 EXP nếu đúng. Trả về giải thích.

**2. Flashcard**
- `POST /api/revision/flashcards`
  - *Payload:* `{ grade, topic }`
  - *Logic:* Lấy FlashcardDeck từ DB.
- `POST /api/revision/flashcards/quiz`
  - *Payload:* `{ flashcardDeckId }`
- *Logic:* Lấy content của bộ flashcard đó, dùng prompt yêu cầu AI: "Dựa vào bộ kiến thức này, hãy tạo ra N câu hỏi trắc nghiệm". Trả về list câu hỏi.

**3. Mindmap**
- `POST /api/revision/mindmap`
  - *Payload:* `{ grade, topic }`
  - *Logic:* Lấy code `Mermaid.js` từ DB. Nếu chưa có, gọi AI sinh ra chuỗi định dạng Mermaid. Cấu trúc yêu cầu AI phải sử dụng classDef để phân chia màu sắc nhánh chính/phụ hài hoà.

---

## 4. Hành động phía Frontend (Lên ý tưởng)
- **Thời gian 30s/câu:** Quản lý đếm ngược (countdown) tại React Component. Hết 30 giây thì tự động khoá ô nhập/chọn và gọi API chấm bài luôn.
- **Render Mindmap:** Sử dụng thư viện `mermaid` kết hợp React để render text do AI/Backend trả về thành sơ đồ đồ hoạ.
- **Render Flashcard:** Dùng Framer Motion tạo hiệu ứng 3D lật thẻ. Thêm 2 nút: "Đã hiểu" (Xanh) - "Cần học lại" (Đỏ) để lọc thẻ.

---
**Trạng thái Kế hoạch:** Hoàn tất, chờ duyệt tiến hành cập nhật Backend Schema và APIs.
