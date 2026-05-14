# Kế hoạch: Hệ thống Activity Log (Nhật ký Hành vi Hệ thống)

> **Ngày tạo:** 2026-05-14
> **Cập nhật lần cuối:** 2026-05-14
> **Trạng thái:** ✅ Đã xác nhận — sẵn sàng thực hiện

---

## Tổng quan

Xây dựng hệ thống ghi nhật ký toàn bộ hoạt động API của hệ thống dưới dạng một **Express Middleware** duy nhất (`activityLogger`). Middleware này tự động ghi lại **mọi request** (kể cả từ phía học sinh sử dụng app lẫn từ phía admin) vào bảng `ActivityLog` trong DB, cho phép Admin theo dõi, tìm kiếm và phân tích hành vi người dùng theo thời gian thực.

---

## Phân tích Kiến trúc Hiện tại

Hệ thống có **11 module API** được mount tại `/api`:

| Prefix | Module | Phía sử dụng |
|---|---|---|
| `/auth` | Auth | Tất cả |
| `/users` | User Management | Admin |
| `/classes` | Class Management | Admin |
| `/system` | System Config | Admin |
| `/knowledge` | Knowledge Base | Admin |
| `/chat` | Chat AI | **Học sinh** |
| `/revision` | Revision (Quiz, Flashcard, Mindmap) | **Học sinh** |
| `/arena` | Arena (Đấu trường) | **Học sinh** |
| `/documents` | Documents | Admin |
| `/gamification` | Gamification (XP, Streak) | **Học sinh** |
| `/reports` | Reports & Analytics | Admin |

**Điểm thuận lợi**: Middleware `authenticate` đã gắn `req.auth` (userId, username, role) vào mọi request authenticated — không cần logic phức tạp để lấy thông tin user.

---

## Quyết định Đã Xác nhận

| Câu hỏi | Quyết định |
|---|---|
| **Log guest (chưa đăng nhập)?** | **Có** — `userId = null`, hiển thị "Khách" trong UI |
| **Phạm vi log** | **Tất cả request** (cả học sinh dùng app lẫn admin) — đây là mục đích chính |
| **Thêm filter theo nguồn** | **Có** — filter theo `Student Events` (học sinh) và `Admin Routes` (quản trị) |
| **Thời gian lưu trữ** | **90 ngày** — auto-cleanup khi query |

---

## Thiết kế Dữ liệu

### Schema `ActivityLog`

```prisma
model ActivityLog {
  id           String   @id @default(uuid())

  // Thông tin User thực hiện
  userId       String?  // null nếu chưa đăng nhập
  username     String?
  userRole     String?  // STUDENT, TEACHER, ADMIN, null (guest)

  // Phân loại nguồn hành động
  source       String   // "student" | "admin" | "guest"

  // Thông tin Request
  method       String   // GET, POST, PUT, PATCH, DELETE
  path         String   // /api/chat/sessions/xxx/messages
  module       String   // chat, users, arena, revision...
  action       String   // Tên hành động dễ đọc: "Gửi tin nhắn AI"

  // Thông tin Response
  statusCode   Int      // 200, 201, 401, 422, 500...
  durationMs   Int      // Thời gian xử lý (milliseconds)

  // Metadata bổ sung
  ipAddress    String?
  userAgent    String?
  errorMessage String?  // Nếu request thất bại (statusCode >= 400)

  createdAt    DateTime @default(now())

  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([module])
  @@index([source])
  @@index([createdAt])
  @@index([statusCode])
  @@index([userRole])
}
```

**Trường `source`** là trung tâm để phân loại:

| `source` | Điều kiện |
|---|---|
| `"student"` | `userRole === "STUDENT"` |
| `"admin"` | `userRole === "ADMIN"` hoặc `"TEACHER"` |
| `"guest"` | Chưa đăng nhập (`req.auth` không tồn tại) |

---

## Thiết kế Middleware

### `server/middleware/activity-logger.ts` (MỚI)

Middleware được gắn **toàn cục** ngay sau `cookieParser` và `authenticate` — hoạt động theo cơ chế **response hook**:

```
Request đến
    ↓
authenticate() → gắn req.auth nếu có token (hoặc bỏ qua nếu không có)
    ↓
activityLogger() → ghi lại startTime, bắt sự kiện 'finish' của response
    ↓
Controller xử lý...
    ↓
Response gửi đi → hook 'finish' kích hoạt
    ↓
Ghi ActivityLog vào DB (async, KHÔNG block response)
```

**Cấu trúc code**:

```typescript
export const activityLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    // Bỏ qua: health check, swagger docs, static files
    if (shouldSkipLog(req.path)) return;

    const duration = Date.now() - startTime;
    const { module, action } = resolveModuleAndAction(req.method, req.path);
    const source = resolveSource(req.auth?.role);

    await prisma.activityLog.create({
      data: {
        userId:       req.auth?.userId ?? null,
        username:     req.auth?.username ?? null,
        userRole:     req.auth?.role ?? null,
        source,
        method:       req.method,
        path:         req.path,
        module,
        action,
        statusCode:   res.statusCode,
        durationMs:   duration,
        ipAddress:    req.ip,
        userAgent:    req.headers['user-agent'] ?? null,
        errorMessage: res.statusCode >= 400 ? (res.locals.errorMessage ?? null) : null,
      }
    }).catch(console.error); // Không bao giờ crash app nếu log lỗi
  });

  next();
};
```

### Hàm `shouldSkipLog(path)` — Danh sách KHÔNG log

```typescript
const SKIP_PATHS = [
  '/api/health',
  '/api-docs',
  '/favicon.ico',
];

function shouldSkipLog(path: string): boolean {
  return SKIP_PATHS.some(p => path.startsWith(p));
}
```

> Toàn bộ request còn lại — kể cả GET của học sinh — đều được log.

### Hàm `resolveModuleAndAction(method, path)` — Bảng Mapping

| Method | Path Pattern | Module | Action |
|---|---|---|---|
| `POST` | `/api/auth/login` | `auth` | Đăng nhập hệ thống |
| `POST` | `/api/auth/logout` | `auth` | Đăng xuất |
| `POST` | `/api/auth/refresh` | `auth` | Làm mới phiên đăng nhập |
| `POST` | `/api/chat/sessions` | `chat` | Tạo phiên hội thoại mới |
| `POST` | `/api/chat/sessions/:id/messages` | `chat` | Gửi tin nhắn AI |
| `GET` | `/api/chat/sessions` | `chat` | Xem danh sách hội thoại |
| `DELETE` | `/api/chat/sessions/:id` | `chat` | Xóa phiên hội thoại |
| `POST` | `/api/arena/submit` | `arena` | Nộp kết quả trận đấu |
| `GET` | `/api/arena/leaderboard` | `arena` | Xem bảng xếp hạng Arena |
| `GET` | `/api/arena/my-stats` | `arena` | Xem thống kê cá nhân Arena |
| `POST` | `/api/revision/quiz/submit` | `revision` | Nộp bài Quiz |
| `GET` | `/api/revision/flashcard-decks` | `revision` | Xem bộ Flashcard |
| `GET` | `/api/revision/mindmaps` | `revision` | Xem sơ đồ tư duy |
| `GET` | `/api/gamification/daily-reward` | `gamification` | Nhận thưởng đăng nhập hàng ngày |
| `POST` | `/api/users` | `users` | Tạo tài khoản người dùng |
| `PUT` | `/api/users/:id` | `users` | Cập nhật thông tin user |
| `DELETE` | `/api/users/:id` | `users` | Xóa tài khoản user |
| `POST` | `/api/classes` | `classes` | Tạo lớp học |
| `POST` | `/api/system/configs` | `system` | Tạo cấu hình hệ thống |
| `PUT` | `/api/system/configs/:key` | `system` | Cập nhật cấu hình |
| `POST` | `/api/documents/upload` | `documents` | Tải lên tài liệu |
| `GET` | `/api/reports/*` | `reports` | Xem báo cáo |
| *(fallback)* | *(bất kỳ)* | *(segment đầu của path)* | `{METHOD} {path}` |

---

## Chiến lược Cleanup Log (90 ngày)

Không dùng cron job riêng — thay vào đó **cleanup inline** mỗi khi query danh sách:

```typescript
// Trong getActivityLogs():
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 90);

// Xóa record cũ (chạy song song với query chính, không await)
prisma.activityLog
  .deleteMany({ where: { createdAt: { lt: cutoff } } })
  .catch(console.error);
```

Ngoài ra có thể cấu hình qua `SystemConfig["LOG_RETENTION_DAYS"]` (default `"90"`).

---

## API Endpoints cho Admin

### GET `/api/reports/activity-logs`

**Query Params:**

| Param | Kiểu | Mô tả | Ví dụ |
|---|---|---|---|
| `page` | int | Số trang | `1` |
| `limit` | int | Kết quả mỗi trang | `50` |
| `source` | string | **Lọc nguồn** | `student`, `admin`, `guest` |
| `userId` | string | Lọc theo user ID | `abc-123` |
| `username` | string | Tìm theo username (ILIKE) | `lehoangnam` |
| `module` | string | Lọc theo module | `chat`, `arena` |
| `method` | string | Lọc theo HTTP method | `POST`, `DELETE` |
| `statusGroup` | string | Nhóm status | `2xx`, `4xx`, `5xx` |
| `dateFrom` | string | Từ ngày (ISO) | `2026-05-01` |
| `dateTo` | string | Đến ngày (ISO) | `2026-05-14` |
| `search` | string | Tìm theo action hoặc username | `Gửi tin nhắn` |
| `minDuration` | int | Lọc request chậm (ms) | `2000` |

**Response mẫu:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "username": "lehoangnam",
      "userRole": "STUDENT",
      "source": "student",
      "method": "POST",
      "path": "/api/chat/sessions/xxx/messages",
      "module": "chat",
      "action": "Gửi tin nhắn AI",
      "statusCode": 200,
      "durationMs": 1243,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "errorMessage": null,
      "createdAt": "2026-05-14T06:55:00.000Z"
    }
  ],
  "pagination": { "total": 5000, "page": 1, "limit": 50, "totalPages": 100 }
}
```

### GET `/api/reports/activity-logs/summary`

Thống kê tổng hợp nhanh:
- Tổng số request hôm nay / 7 ngày / 30 ngày
- Tỷ lệ lỗi (4xx, 5xx)
- Top 5 module hoạt động nhiều nhất
- Top 10 user hoạt động nhiều nhất (kèm phân loại student/admin)
- Danh sách request chậm nhất (> 2s)
- Phân bố theo `source` (student vs admin vs guest)

---

## Kế hoạch Thực hiện

### PHASE 1 — Database & Middleware

#### [MODIFY] `server/prisma/schema.prisma`
- Thêm model `ActivityLog` với trường `source` và đầy đủ index
- Thêm relation `activityLogs ActivityLog[]` vào model `User`
- Chạy `npx prisma db push`

#### [NEW] `server/middleware/activity-logger.ts`
- Middleware `activityLogger`
- Hàm `shouldSkipLog(path)` — danh sách path loại trừ
- Hàm `resolveModuleAndAction(method, path)` — bảng mapping đầy đủ
- Hàm `resolveSource(role)` — phân loại `student | admin | guest`

#### [MODIFY] `server/index.ts`
- Gắn `activityLogger` middleware **global** vào Express app (sau `authenticate`)

#### [MODIFY] `server/services/system.service.ts`
- Thêm seed config `LOG_RETENTION_DAYS = "90"` vào `ensureDefaultConfigs()`

---

### PHASE 2 — API

#### [MODIFY] `server/services/report.service.ts`
- Thêm `getActivityLogs(filters)` — query đầy đủ filter + phân trang + inline cleanup 90 ngày

#### [MODIFY] `server/controllers/report.controller.ts`
- Thêm `getActivityLogs` handler
- Thêm `getActivityLogSummary` handler

#### [MODIFY] `server/routes/report.routes.ts`
- `GET /api/reports/activity-logs` — Swagger docs đầy đủ params
- `GET /api/reports/activity-logs/summary`

---

### PHASE 3 — Frontend Admin UI

#### [NEW] `client/src/features/admin/activity-logs/`

**Trang danh sách — `ActivityLog-Index.tsx`:**

- **4 Stat Cards** ở header:
  - 🟢 Tổng request hôm nay
  - 🟡 Lỗi 4xx (client error)
  - 🔴 Lỗi 5xx (server error)
  - ⏱️ Request chậm > 2s

- **Thanh Filter** (2 dòng):
  - Dòng 1: Search box | Dropdown Module | Dropdown Method | Dropdown Status Group
  - Dòng 2: **Toggle Source** (Tất cả / Học sinh / Admin / Khách) | DateRangePicker | Input min duration | Nút Reset filter

- **Bảng Log** với các cột:
  | Cột | Mô tả |
  |---|---|
  | Badge Method | `POST` (xanh), `DELETE` (đỏ), `GET` (xám), `PUT` (cam) |
  | Badge Status | `2xx` (xanh lá), `4xx` (vàng), `5xx` (đỏ) |
  | Badge Source | `Học sinh` (tím), `Admin` (xanh dương), `Khách` (xám) |
  | Badge Module | màu phân biệt: `chat`, `arena`, `revision`, `users`... |
  | User | Avatar + Tên + role tag (hoặc "Khách" nếu guest) |
  | Action | Tên hành động dễ đọc: "Gửi tin nhắn AI" |
  | Duration | Số ms, **tô đỏ** nếu > 2000ms |
  | Thời gian | Relative: "2 phút trước", tooltip hiện ISO đầy đủ |

- **Click vào row** → Drawer chi tiết:
  - Path gốc đầy đủ
  - IP Address
  - User Agent
  - Error message (nếu có)
  - Toàn bộ thông tin raw

---

## Tổng kết Quyết định

| Câu hỏi | Quyết định |
|---|---|
| Log guest? | **Có** — `userId = null`, hiển thị "Khách" |
| Phạm vi log | **Tất cả request** ngoại trừ `/health`, `/api-docs` |
| Filter theo nguồn | **Có** — toggle `Học sinh` / `Admin` / `Khách` |
| Thời gian lưu | **90 ngày** — inline cleanup khi query |

> [!NOTE]
> Plan sẵn sàng. Gõ **"Bắt đầu"** để triển khai theo thứ tự: **Schema → Middleware → API → UI**
