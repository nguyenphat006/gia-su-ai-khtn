# Kế hoạch: Hệ thống Activity Log (Nhật ký Hành vi Hệ thống)

> **Ngày tạo:** 2026-05-14
> **Trạng thái:** 📝 Đang lên kế hoạch

---

## Tổng quan

Xây dựng hệ thống ghi nhật ký toàn bộ hoạt động API của hệ thống dưới dạng một **Express Middleware** duy nhất (`activityLogger`). Middleware này sẽ tự động ghi lại mọi request vào bảng `ActivityLog` trong DB, cho phép Admin theo dõi, tìm kiếm và phân tích hành vi người dùng theo thời gian thực.

---

## Phân tích Kiến trúc Hiện tại

Hệ thống có **11 module API** được mount tại `/api`:

| Prefix | Module | Mô tả |
|---|---|---|
| `/auth` | Auth | Đăng nhập, đăng xuất, refresh token |
| `/users` | User Management | Quản lý tài khoản người dùng |
| `/classes` | Class Management | Quản lý lớp học |
| `/system` | System Config | Cấu hình hệ thống |
| `/knowledge` | Knowledge Base | Tài liệu kiến thức |
| `/chat` | Chat AI | Hội thoại với Gia sư AI |
| `/revision` | Revision | Ôn tập (Quiz, Flashcard, Mindmap) |
| `/arena` | Arena | Đấu trường trí tuệ |
| `/documents` | Documents | Tải lên tài liệu |
| `/gamification` | Gamification | XP, Streak, Challenges |
| `/reports` | Reports | Báo cáo & phân tích |

**Điểm thuận lợi**: Middleware `authenticate` đã gắn `req.auth` (userId, username, role) vào mọi request authenticated — không cần logic phức tạp để lấy thông tin user.

---

## Thiết kế Dữ liệu

### Schema `ActivityLog`

```prisma
model ActivityLog {
  id           String   @id @default(uuid())

  // Thông tin User thực hiện
  userId       String?  // null nếu chưa đăng nhập (login, health check...)
  username     String?
  userRole     String?  // STUDENT, TEACHER, ADMIN

  // Thông tin Request
  method       String   // GET, POST, PUT, PATCH, DELETE
  path         String   // /api/chat/sessions/xxx/messages
  module       String   // chat, users, arena, revision...
  action       String   // Tên hành động cụ thể, VD: "Gửi tin nhắn AI", "Tạo quiz"
  
  // Thông tin Response
  statusCode   Int      // 200, 201, 401, 422, 500...
  durationMs   Int      // Thời gian xử lý (milliseconds)
  
  // Metadata bổ sung
  ipAddress    String?
  userAgent    String?
  errorMessage String?  // Nếu request thất bại

  createdAt    DateTime @default(now())

  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([module])
  @@index([createdAt])
  @@index([statusCode])
}
```

---

## Thiết kế Middleware

### `server/middleware/activity-logger.ts` (MỚI)

Middleware được gắn **toàn cục** sau `authenticate` — hoạt động theo cơ chế **response hook**:

```
Request đến
    ↓
authenticate() → gắn req.auth nếu có token
    ↓
activityLogger() → ghi lại startTime, bắt sự kiện 'finish' của response
    ↓
Controller xử lý...
    ↓
Response gửi đi → hook 'finish' kích hoạt
    ↓
Ghi ActivityLog vào DB (async, không block response)
```

**Cấu trúc code**:

```typescript
export const activityLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const { module, action } = resolveModuleAndAction(req.method, req.path);

    await prisma.activityLog.create({
      data: {
        userId: req.auth?.userId ?? null,
        username: req.auth?.username ?? null,
        userRole: req.auth?.role ?? null,
        method: req.method,
        path: req.path,
        module,
        action,
        statusCode: res.statusCode,
        durationMs: duration,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: res.statusCode >= 400 ? res.locals.errorMessage : null,
      }
    }).catch(console.error); // Không bao giờ block response
  });

  next();
};
```

### Hàm `resolveModuleAndAction(method, path)`

Map từ `method + path` sang tên module và tên hành động **dễ đọc bằng tiếng Việt**:

| Method | Path Pattern | Module | Action |
|---|---|---|---|
| `POST` | `/api/auth/login` | `auth` | Đăng nhập |
| `POST` | `/api/auth/logout` | `auth` | Đăng xuất |
| `POST` | `/api/chat/sessions` | `chat` | Tạo phiên hội thoại mới |
| `POST` | `/api/chat/sessions/:id/messages` | `chat` | Gửi tin nhắn AI |
| `GET` | `/api/chat/sessions` | `chat` | Xem danh sách hội thoại |
| `POST` | `/api/arena/submit` | `arena` | Nộp kết quả trận đấu |
| `GET` | `/api/arena/leaderboard` | `arena` | Xem bảng xếp hạng Arena |
| `POST` | `/api/revision/quiz/submit` | `revision` | Nộp bài quiz |
| `POST` | `/api/users` | `users` | Tạo tài khoản người dùng |
| `PUT` | `/api/users/:id` | `users` | Cập nhật thông tin user |
| `POST` | `/api/system/configs` | `system` | Cập nhật cấu hình hệ thống |
| `POST` | `/api/documents/upload` | `documents` | Tải lên tài liệu |
| `GET` | `/api/reports/*` | `reports` | Xem báo cáo |
| `GET` | `/api/health` | `system` | Health check |
| *(khác)* | *(bất kỳ)* | *(tự suy luận từ path segment đầu tiên)* | *(method + path)* |

---

## Chiến lược Lọc & Kiểm soát Volume

Không phải mọi request đều cần log để tránh DB phình to:

### Các request **KHÔNG log**:
- `GET /api/health` — health check tự động
- `GET /api/chat/sessions/:id/messages` — load lịch sử chat (read-only, không hành vi)
- `GET /api/revision/questions` — tải câu hỏi (read-only, không hành vi)
- Static assets, Swagger UI (`/api-docs`)

### Các request **BẮT BUỘC log** (write + auth + admin):
- Mọi `POST`, `PUT`, `PATCH`, `DELETE`
- `GET` liên quan đến admin actions (xem reports, xem user list)
- Mọi request có `statusCode >= 400` (lỗi)

### Giữ log **tối đa 90 ngày** (có thể config qua `SystemConfig["LOG_RETENTION_DAYS"]`)

---

## API Endpoints cho Admin

### GET `/api/reports/activity-logs`

Lấy danh sách nhật ký với đầy đủ filter:

**Query Params:**
| Param | Kiểu | Mô tả | Ví dụ |
|---|---|---|---|
| `page` | int | Số trang | `1` |
| `limit` | int | Kết quả mỗi trang | `50` |
| `userId` | string | Lọc theo user ID | `abc-123` |
| `username` | string | Tìm theo username (ILIKE) | `lehoangnam` |
| `module` | string | Lọc theo module | `chat`, `arena` |
| `method` | string | Lọc theo HTTP method | `POST` |
| `statusCode` | int | Lọc theo status code | `500` |
| `statusGroup` | string | Nhóm status | `2xx`, `4xx`, `5xx` |
| `dateFrom` | string | Từ ngày (ISO) | `2026-05-01` |
| `dateTo` | string | Đến ngày (ISO) | `2026-05-14` |
| `search` | string | Tìm theo action hoặc path | `Gửi tin nhắn` |
| `minDuration` | int | Lọc request chậm (ms) | `1000` |

**Response mẫu:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "username": "lehoangnam",
      "userRole": "STUDENT",
      "method": "POST",
      "path": "/api/chat/sessions/xxx/messages",
      "module": "chat",
      "action": "Gửi tin nhắn AI",
      "statusCode": 200,
      "durationMs": 1243,
      "ipAddress": "192.168.1.1",
      "errorMessage": null,
      "createdAt": "2026-05-14T06:55:00.000Z"
    }
  ],
  "pagination": { "total": 1000, "page": 1, "limit": 50, "totalPages": 20 }
}
```

### GET `/api/reports/activity-logs/summary`

Thống kê tổng hợp:
- Tổng số request hôm nay / 7 ngày / 30 ngày
- Tỷ lệ lỗi (4xx, 5xx)
- Top 5 module hoạt động nhiều nhất
- Top 10 user hoạt động nhiều nhất
- Danh sách request chậm nhất (> 2s)

---

## Kế hoạch Thực hiện

### PHASE 1 — Database & Middleware

#### [MODIFY] `server/prisma/schema.prisma`
- Thêm model `ActivityLog` với đầy đủ index

#### [NEW] `server/middleware/activity-logger.ts`
- Middleware `activityLogger`
- Hàm `resolveModuleAndAction(method, path)` với bảng mapping đầy đủ
- Hàm `shouldLog(method, path)` để quyết định có log không

#### [MODIFY] `server/index.ts` (hoặc file app entry point)
- Gắn `activityLogger` middleware vào global Express app (sau `authenticate`)

#### [MODIFY] `server/services/system.service.ts`
- Thêm seed config `LOG_RETENTION_DAYS = "90"` vào `ensureDefaultConfigs()`

---

### PHASE 2 — API

#### [MODIFY] `server/services/report.service.ts`
- Thêm `getActivityLogs(filters)` — query có đầy đủ filter + phân trang
- Thêm `getActivityLogSummary()` — thống kê tổng hợp

#### [MODIFY] `server/controllers/report.controller.ts`
- Thêm `getActivityLogs` handler
- Thêm `getActivityLogSummary` handler

#### [MODIFY] `server/routes/report.routes.ts`
- `GET /api/reports/activity-logs` — với Swagger docs đầy đủ
- `GET /api/reports/activity-logs/summary`

---

### PHASE 3 — Frontend Admin UI

#### [NEW] `client/src/features/admin/activity-logs/`

**Trang danh sách — `ActivityLog-Index.tsx`:**
- Header với **4 stat cards**: Tổng hôm nay | Lỗi 4xx | Lỗi 5xx | Request chậm >2s
- **Thanh filter**:
  - Search box (tìm theo username hoặc action)
  - Dropdown Module (chat, arena, revision, users...)
  - Dropdown Method (GET, POST, DELETE...)
  - Dropdown Status Group (Thành công, Lỗi client, Lỗi server)
  - DateRangePicker (từ ngày → đến ngày)
  - Badge reset filter
- **Bảng log** (mỗi row):
  - Badge Method màu: `POST` (xanh dương), `DELETE` (đỏ), `GET` (xám)
  - Badge Status: `2xx` (xanh lá), `4xx` (vàng), `5xx` (đỏ)
  - Badge Module: `chat`, `arena`, `revision`... (màu phân biệt)
  - Avatar + Tên user (hoặc "Khách" nếu không đăng nhập)
  - Tên Action dễ đọc: "Gửi tin nhắn AI", "Nộp kết quả Arena"...
  - Duration: hiện thị ms, tô đỏ nếu > 2000ms
  - Thời gian relative: "2 phút trước", "hôm qua lúc 15:30"
- Click vào row → **Drawer/Panel** xem chi tiết đầy đủ (method, path gốc, userAgent, IP, error message)

---

## Câu hỏi Mở

> [!IMPORTANT]
> **Q1: Log request của guest (chưa đăng nhập) không?**
> Hiện tại `/api/auth/login` và `/api/health` không cần token. Có log các request này không?
> → Đề xuất: Có, nhưng `userId = null`, hiển thị "Khách" trong UI.

> [!IMPORTANT]
> **Q2: Có cần log GET (đọc dữ liệu) không?**
> Log tất cả GET sẽ tạo rất nhiều record. Đề xuất chỉ log GET của admin routes và GET có lỗi.
> → Cần xác nhận chính sách log.

> [!IMPORTANT]
> **Q3: Thời gian lưu trữ log?**
> Mặc định đề xuất 90 ngày rồi tự động xóa (cần cron job hoặc check lúc query). Có phù hợp không?

> [!NOTE]
> Plan sẵn sàng. Gõ **"Bắt đầu"** để triển khai theo thứ tự: **Schema → Middleware → API → UI**
