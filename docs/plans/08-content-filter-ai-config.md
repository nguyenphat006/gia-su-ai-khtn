# Kế hoạch: Bộ lọc Nội dung & Trung tâm Cấu hình AI

> **Cập nhật lần cuối:** 2026-05-13
> **Trạng thái:** ✅ Đã xác nhận — sẵn sàng thực hiện

---

## Tổng quan vấn đề

Hệ thống hiện tại có điểm yếu:
1. **Không có lớp kiểm duyệt nội dung**: User có thể gửi bất kỳ nội dung nào (chửi thề, từ ngữ không phù hợp) và AI vẫn phản hồi bình thường.
2. **Cấu hình AI bị phân tán**: Model AI (`GEMINI_MODEL`) bị hardcode vào `process.env`, không quản lý được qua admin panel. Chỉ có `AI_SYSTEM_PROMPT` là có thể edit được.
3. **Không có chính sách phạt**: Không có cơ chế trừ điểm khi user vi phạm.

---

## Phân tích Kiến trúc Hiện tại

| Thành phần | File | Vấn đề |
|---|---|---|
| AI invoke | `ai.service.ts` | Model hardcode từ `process.env` |
| Prompt | `system.service.ts` → `SystemConfig["AI_SYSTEM_PROMPT"]` | Chỉ config được prompt |
| Chat flow | `chat.service.ts` | Không có bước kiểm duyệt trước khi gọi AI |
| Admin UI | `system-config/` | Chưa có UI cấu hình model, chưa có filter settings |

---

## Ý tưởng Đề xuất

### A. Content Moderation Layer (Lớp Kiểm duyệt)

**Cách tiếp cận**: Dùng chính Gemini làm "content judge" với một prompt ngắn gọn được thiết kế riêng — gọi là **Guard Model**. Approach này có nhiều ưu điểm hơn so với danh sách từ cấm tĩnh (static blacklist):

| | Static Blacklist | Gemini Guard Model |
|---|---|---|
| Độ chính xác | Thấp (bỏ sót biến thể như "ch-i-thề") | Cao (hiểu ngữ cảnh) |
| Tiếng Việt | Khó xử lý biến thể | Native support |
| Tùy chỉnh | Cần sửa code | Chỉnh prompt trong Admin |
| Hiệu năng | Nhanh | Thêm ~0.5-1s latency |

**Flow đề xuất**:
```
User gửi message
    ↓
[GUARD CHECK] - Gọi Guard Model với prompt ngắn
    ↓ PASS               ↓ FAIL
Gọi AI bình thường   Trả thông báo cảnh báo + Trừ XP + Ghi ViolationLog
    ↓
Lưu vào ChatMessage
```

**Guard Model prompt mẫu** (có thể config trong Admin):
> "Đánh giá nội dung sau có vi phạm chuẩn mực không (chửi thề, từ ngữ thô tục, kích động bạo lực, nội dung 18+)?
> Trả lời JSON: `{"violated": true/false, "reason": "..."}`"

**Lợi ích bổ sung**:
- Guard prompt cũng có thể config để **giới hạn chủ đề** (không trả lời về chủ đề ngoài KHTN)
- Lưu log vi phạm để Admin xem báo cáo
- Guard chỉ check **text message**, chưa check ảnh

### B. AI Config Center (Trung tâm Cấu hình AI)

Mở rộng `SystemConfig` với các key mới có cấu trúc rõ ràng:

| Config Key | Giá trị mẫu | Mô tả |
|---|---|---|
| `AI_SYSTEM_PROMPT` | *(hiện có)* | Prompt chính của Gia sư AI |
| `AI_MODEL` | `gemini-2.0-flash-lite` | Model AI chính |
| `AI_TEMPERATURE` | `0.7` | Độ sáng tạo (0.0 - 1.0) |
| `AI_GUARD_ENABLED` | `true` | Bật/tắt bộ lọc nội dung |
| `AI_GUARD_PROMPT` | *(prompt ngắn)* | Prompt kiểm duyệt nội dung |
| `AI_GUARD_MODEL` | `gemini-2.0-flash-lite` | Model dùng để guard |
| `AI_GUARD_XP_PENALTY_BASE` | `20` | Mức XP trừ cơ bản cho lần vi phạm đầu tiên trong tháng |
| `AI_GUARD_BLOCK_MESSAGE` | `"..."` | Thông báo trả về khi bị chặn |
| `AI_MAX_HISTORY_MESSAGES` | `10` | Số tin nhắn lịch sử đưa vào context |

### C. Violation Log (Nhật ký Vi phạm)

Lưu lại mỗi lần bị chặn để Admin có thể xem báo cáo:
- Ai vi phạm, khi nào, **nội dung nguyên văn**, lý do guard trả về
- Thống kê số lần vi phạm theo user → phục vụ báo cáo analytics

### D. Cơ chế Penalty Nhân đôi (Progressive Penalty)

Số XP bị trừ tăng theo lũy thừa dựa trên **tổng số lần vi phạm trong tháng hiện tại** của user. Cuối tháng reset về 0.

| Lần vi phạm trong tháng | Công thức | Mức trừ (base = 20 XP) |
|---|---|---|
| Lần 1 | base × 2⁰ | 20 XP |
| Lần 2 | base × 2¹ | 40 XP |
| Lần 3 | base × 2² | 80 XP |
| Lần 4 | base × 2³ | 160 XP |
| Lần 5+ | base × 2⁴ (capped) | 320 XP (tối đa) |

**Logic tính toán** trong `chat.service.ts`:
1. Đếm số `ViolationLog` của userId trong tháng hiện tại
2. `penalty = basePenalty * Math.pow(2, Math.min(violationCount, 4))`
3. Trừ XP (không để XP < 0)
4. Ghi `ViolationLog` mới với `xpPenalty` thực tế bị trừ
5. Reset: hệ thống tự động reset bằng cách đếm từ đầu tháng (không cần cron job riêng)

---

## Kế hoạch Thực hiện

### PHASE 1 — Backend: AI Config & Guard Logic

#### [MODIFY] `server/prisma/schema.prisma`
- Thêm model `ViolationLog`:
```prisma
model ViolationLog {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content      String   @db.Text  // Nội dung vi phạm (nguyên văn)
  reason       String             // Lý do guard AI trả về
  xpPenalty    Int      @default(0) // Số XP thực tế bị trừ
  violationNo  Int      @default(1) // Lần vi phạm thứ mấy trong tháng

  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([userId, createdAt]) // Để đếm vi phạm trong tháng nhanh
}
```
- Thêm relation `violationLogs ViolationLog[]` vào model `User`

#### [MODIFY] `server/services/system.service.ts`
- Thêm hàm `ensureDefaultAIConfigs()`: seed các config key mới vào DB nếu chưa có
- Seed default values cho tất cả key `AI_*` khi server khởi động

#### [MODIFY] `server/services/ai.service.ts`
- Đọc `AI_MODEL` và `AI_TEMPERATURE` từ `SystemConfig` (thay vì hardcode từ `process.env`)
- Thêm hàm `checkContentGuard(message: string)`:
  - Đọc `AI_GUARD_ENABLED`, `AI_GUARD_PROMPT`, `AI_GUARD_MODEL` từ SystemConfig
  - Nếu guard disabled → return `{ violated: false }`
  - Gọi Gemini với guard prompt, parse JSON response
  - Trả về `{ violated: boolean, reason: string }`

#### [MODIFY] `server/services/chat.service.ts`
- Thêm **Bước 2.5** (sau khi lưu user message, trước khi gọi AI):
  - Gọi `checkContentGuard(content)`
  - Nếu `violated = true`:
    - Đếm số lần vi phạm trong tháng → tính penalty nhân đôi
    - Trừ XP theo penalty (không để XP < 0)
    - Lưu thông báo cảnh báo vào `ChatMessage` (role: MODEL)
    - Ghi vào bảng `ViolationLog`
    - Return sớm (không gọi AI chính)

---

### PHASE 2 — Backend: API cho Admin

#### [MODIFY] `server/routes/system.routes.ts`
- `GET /api/system/configs/ai` — lấy tất cả config có prefix `AI_` (có cấu trúc, nhóm theo nhóm)
- `POST /api/system/configs/ai/batch` — cập nhật nhiều AI config cùng lúc (1 request save all)

#### [MODIFY] `server/routes/report.routes.ts`
- `GET /api/reports/violations` — danh sách vi phạm (phân trang, lọc theo `userId`, `month`, `year`)
- `GET /api/reports/violations/summary` — thống kê tổng số vi phạm theo user (top offenders)

---

### PHASE 3 — Frontend: Admin UI

#### [NEW] `client/src/features/admin/ai-config/`
Trang **"Cài đặt AI"** với 4 section trên 1 trang:

**Section 1 — Model & Hiệu suất**
- Dropdown chọn Gemini model: `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-2.5-pro-preview`...
- Slider `Temperature` (0.0 → 1.0) với mô tả trực quan ("Chính xác" ↔ "Sáng tạo")
- Input số `Số tin nhắn lịch sử tối đa`
- Nút **"Test kết nối"** → gọi API ping Gemini, hiển thị latency

**Section 2 — System Prompt**
- Textarea lớn để edit `AI_SYSTEM_PROMPT`
- Preview live với placeholder `{context}`

**Section 3 — Bộ lọc Nội dung (Guard)**
- Toggle bật/tắt Guard (với badge trạng thái ACTIVE/DISABLED)
- Dropdown Guard Model (có thể dùng model nhỏ hơn để tiết kiệm)
- Textarea Guard Prompt
- Input số XP cơ bản (`AI_GUARD_XP_PENALTY_BASE`) với **preview bảng penalty nhân đôi** ngay bên cạnh
- Textarea thông báo cảnh báo hiển thị khi bị chặn

**Section 4 — Liên kết nhanh**
- Card hiển thị số vi phạm trong tháng + link sang `/admin/violations`

#### [NEW] `client/src/features/admin/violations/`
Trang **"Nhật ký Vi phạm"**:
- Bảng danh sách: Avatar + Tên học sinh | Nội dung vi phạm (truncate 100 ký tự) | Lý do Guard | XP bị trừ | Lần thứ N trong tháng | Thời gian
- Filter: Tìm theo tên/username, chọn Tháng/Năm
- Badge màu `Lần 1` (xanh lá) → `Lần 2` (vàng) → `Lần 3+` (đỏ) để thể hiện mức độ tái phạm
- Click vào row → **Dialog** xem nội dung vi phạm đầy đủ

---

## Quyết định Đã Xác nhận

| Câu hỏi | Quyết định |
|---|---|
| Mức penalty | **Nhân đôi** theo số lần vi phạm trong tháng (base là config key), reset tự động cuối tháng |
| Lưu nội dung vi phạm | **Có** — lưu nguyên văn vào `ViolationLog.content` |
| Guard check ảnh | **Chưa cần** — chỉ check text message trong phase này |
| Approach kiểm duyệt | **Gemini Guard Model** (không dùng static blacklist) |
