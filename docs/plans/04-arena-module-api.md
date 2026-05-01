# Kế hoạch: Module Đấu Trường Trí Tuệ (Arena) — Backend API

## Mục tiêu

Chuyển đổi module "Đấu Trường Trí Tuệ" từ kiến trúc Client-Side (gọi trực tiếp Firebase + Gemini API trên trình duyệt) sang kiến trúc **Server-Side** chuẩn (REST API + Socket.IO), đồng thời bổ sung thêm **Bảng Xếp Hạng (Leaderboard)** lưu trữ bền vững trong PostgreSQL.

---

## Phân tích Hiện trạng

### Những gì ĐÃ CÓ & đang hoạt động tốt:
| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| **Socket.IO Server** (`sockets/arenaHandler.ts`) | ✅ Hoạt động | Lobby, Challenge flow, Matchmaking, Battle scoring |
| **Socket.IO Client** (`useArenaSocket.ts`) | ✅ Hoạt động | Kết nối, nhận/gửi events |
| **UI Components** (6 files) | ✅ Hoạt động | ArenaLobby, AiMatchConfig, PvPMatchConfig, MatchingScreen, ActiveBattle, BattleResult |
| **Prisma Schema** (`QuizHistory`, `UserStats`, `XpLog`) | ✅ Có sẵn | Đã có bảng lưu lịch sử + XP |

### Những gì CẦN LÀM (Vấn đề hiện tại):

> [!WARNING]
> **Vấn đề bảo mật nghiêm trọng:** Logic Arena hiện tại đang gọi Gemini API trực tiếp từ **Client** (file `client/src/lib/gemini.ts`), nghĩa là API Key bị lộ ra phía trình duyệt. Tất cả logic AI phải được chuyển sang Server.

1. **`useArenaLogic.ts`** đang gọi thẳng `generateQuiz()` + `analyzePerformance()` từ `client/src/lib/gemini.ts` → cần đổi sang gọi REST API Server.
2. **`useArenaLogic.ts`** đang lưu kết quả vào **Firebase Firestore** (`arena_results`) → cần đổi sang gọi REST API Server (PostgreSQL).
3. **Leaderboard** đang đọc từ Firestore → cần REST API từ bảng `ArenaResult` mới.
4. **Socket.IO** hiện chỉ quản lý trạng thái phiên → cần bổ sung xác thực người dùng (biết player là ai) và **lọc theo khối lớp (grade)**.

---

## Proposed Changes

### 1. Database — Prisma Schema

#### [MODIFY] [schema.prisma](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/prisma/schema.prisma)

Thêm model `ArenaResult` để lưu kết quả đấu trường:

```prisma
model ArenaResult {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  score      Int      // Điểm đạt được
  mode       String   // "PVP" hoặc "AI"
  winner     Boolean  // Thắng hay thua
  opponent   String   // Tên đối thủ (username hoặc "Gia sư AI")
  topic      String?  // Chủ đề trận đấu
  xpEarned   Int      @default(0) // XP nhận được

  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([score])
}
```

Cập nhật model `User` thêm quan hệ:
```prisma
arenaResults   ArenaResult[]
```

---

### 2. Backend — REST API (Arena)

#### [NEW] [arena.service.ts](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/services/arena.service.ts)

| Hàm | Mô tả |
|---|---|
| `generateArenaQuiz(config)` | Gọi Gemini AI tạo bộ câu hỏi thách đấu (chuyển logic từ client sang server) |
| `saveArenaResult(data)` | Lưu kết quả trận đấu vào bảng `ArenaResult` + cộng XP vào `UserStats` + ghi `XpLog` |
| `getLeaderboard(limit)` | Lấy top N người chơi có điểm cao nhất (aggregate từ `ArenaResult`) |
| `getUserArenaStats(userId)` | Lấy thống kê cá nhân (số trận, số thắng) |

#### [NEW] [arena.controller.ts](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/controllers/arena.controller.ts)

| Endpoint | Method | Auth | Mô tả |
|---|---|---|---|
| `/api/arena/generate-quiz` | POST | Student+ | AI tạo câu hỏi cho trận đấu |
| `/api/arena/results` | POST | Student+ | Lưu kết quả trận đấu |
| `/api/arena/leaderboard` | GET | Student+ | Top 10 bảng xếp hạng |
| `/api/arena/my-stats` | GET | Student+ | Thống kê cá nhân |

#### [NEW] [arena.routes.ts](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/routes/arena.routes.ts)

Đăng ký routes + Swagger documentation cho tất cả endpoints trên.

#### [MODIFY] [api.routes.ts](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/routes/api.routes.ts)

Thêm `router.use("/arena", arenaRoutes);`

#### [MODIFY] [swagger.ts](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/config/swagger.ts)

Thêm tag: `{ name: "Arena", description: "Đấu trường trí tuệ & Bảng xếp hạng" }`

---

### 3. Socket.IO — Nâng cấp Arena Handler

#### [MODIFY] [arenaHandler.ts](file:///d:/Coder/Github/ERICSS/gia-su-ai-khtn/server/sockets/arenaHandler.ts)

Các thay đổi chính:

1. **Lưu `grade` khi join-lobby**: Khi emit `join-lobby`, client sẽ gửi kèm `grade` (khối lớp). Server lưu vào map `players` để có thể lọc danh sách chiến binh online theo khối.

2. **Thêm event `get-online-by-grade`**: Client có thể yêu cầu danh sách chiến binh online đang ở cùng khối lớp.

3. **Sửa scoring đúng yêu cầu**: Trả lời đúng = 10 điểm (thay vì 5 hiện tại). Cả hai đúng → ai nhanh hơn (timeLeft lớn hơn) được thêm bonus.

---

### 4. Chi tiết Logic Trận Đấu (theo yêu cầu cô giáo)

#### Thách Đấu Đôi (PvP):
```
HS_A tìm kiếm HS_B online (cùng khối lớp)
  → HS_B nhận lời mời
  → HS_B chấp nhận → HS_A nhập chủ đề
  → HS_B duyệt chủ đề:
    - Đồng ý → Server gọi AI tạo 10 câu hỏi → Bắt đầu trận
    - Từ chối → HS_A nhập chủ đề mới (tối đa 5 lần)
    - Từ chối 5 lần → "Thách đấu không thành công"
  
  Trong trận đấu:
  - 10 câu, 30 giây/câu
  - Mức độ: Nhận biết + Thông hiểu + Vận dụng (1 phép tính)
  - Đúng = +10 điểm
  - Cả hai đúng → Ai nhanh hơn (ít giây hơn) thắng câu đó
```

#### Thách Đấu AI:
```
HS chọn: Khối/Lớp, Chủ đề, Dạng câu hỏi, Mức độ, Số câu (≤20)
  → Server gọi AI tạo câu hỏi
  → 30 giây/câu, đúng = +10 điểm
  → Kết quả lưu vào DB
```

#### Bảng Xếp Hạng:
```
Top 10 điểm cao nhất từ TẤT CẢ các trận (PvP + AI)
Hiển thị: Hạng, Tên, Điểm, Số trận, Tỷ lệ thắng
```

---

## Open Questions

> [!IMPORTANT]
> **Về việc lọc theo khối lớp:**
> Hiện tại khi học sinh join lobby, client đang gửi `studentName` thay vì thông tin user đầy đủ. Tôi sẽ sửa để Socket gửi kèm `grade` từ `studentProfile` của user đang đăng nhập.

> [!IMPORTANT]
> **Về tính điểm khi cả hai đúng:**
> Yêu cầu gốc nói "tính theo số giây AI ít hơn" — tôi hiểu là ai trả lời **nhanh hơn** (tốn ít giây hơn, tức `timeLeft` lớn hơn) sẽ được thưởng thêm điểm. Cả hai vẫn được 10 điểm cơ bản, nhưng người nhanh hơn được bonus. Bạn xác nhận giúp logic này đúng không?

---

## Verification Plan

### Automated Tests
1. `npx tsc --noEmit` — Kiểm tra TypeScript compile thành công.
2. `npx prisma db push` — Đồng bộ schema mới.
3. Test Swagger UI — Kiểm tra tất cả endpoints Arena hiển thị đúng.

### Manual Verification
- Test `POST /api/arena/generate-quiz` với Swagger để xác nhận AI sinh câu hỏi.
- Test `POST /api/arena/results` để lưu kết quả vào DB.
- Test `GET /api/arena/leaderboard` để kiểm tra top 10.
