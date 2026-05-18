# Kế hoạch: Bảng Thống Kê Hoạt Động Học Sinh (Student Activity Stats)

> **Ngày tạo:** 2026-05-18
> **Trạng thái:** 📝 Đang lên kế hoạch

---

## 1. Phân tích yêu cầu từ hình ảnh

Người dùng mong muốn có một trang danh sách thống kê tổng hợp các chỉ số học tập của từng học sinh. Dựa vào hình ảnh, các cột dữ liệu cần hiển thị bao gồm:

| Tên cột | Ánh xạ với Database | Nguồn dữ liệu |
|---|---|---|
| **Học sinh** | Tên hiển thị (displayName) / Mã HS | `User` (role = `STUDENT`) kèm `StudentProfile` |
| **Đặt câu hỏi AI** | Số lượng tin nhắn User gửi cho AI | Đếm số `ChatMessage` có `role = 'USER'` của user đó |
| **Mindmap hoàn thành** | Số lần xem sơ đồ tư duy | Đếm trong bảng `ActivityLog` với `action = 'Xem sơ đồ tư duy'` |
| **Flashcard đã học** | Số lần học thẻ ghi nhớ | Đếm trong bảng `ActivityLog` với `action = 'Xem bộ Flashcard'` |
| **Điểm EXP** | Tổng điểm kinh nghiệm | Cột `totalXp` trong bảng `UserStats` |
| **Chuỗi ngày học** | Chuỗi đăng nhập/học tập liên tiếp | Cột `currentStreak` trong bảng `UserStats` |
| **Tham gia đấu trường** | Số lần chơi Arena (PVP/AI) | Đếm trong bảng `ArenaResult` |

---

## 2. Vị trí đặt trang (UI Placement)

> **Đề xuất:** Nên đặt trang này ở module **Báo cáo & Thống kê (Analytics)** thay vì trang Quản lý tài khoản (User Management). 

**Lý do:**
- Trang Quản lý tài khoản (`User-Index.tsx`) tập trung vào thao tác tạo, sửa, xóa, cấp quyền, reset mật khẩu. Việc nhồi nhét quá nhiều cột số liệu thống kê sẽ làm bảng bị quá tải và chậm.
- Trang này thuần túy là số liệu **Báo cáo**, rất phù hợp để nằm trong menu `Analytics`.

**Vị trí cụ thể:**
- URL: `/admin/analytics/students`
- Menu Frontend: Thêm tab/menu **"Thống kê Học sinh"** ngay dưới "Tổng quan" và "Lịch sử Arena".
- Tên component: `client/src/features/admin/analytics/Student-Stats-Index.tsx`.

---

## 3. Kiến trúc API (Backend)

Sẽ tạo một endpoint mới phục vụ riêng cho trang này để đảm bảo load nhanh và phân trang tốt.

### Endpoint: `GET /api/reports/student-stats`
- **Quyền:** ADMIN, TEACHER
- **Tham số (Query):**
  - `page`: Trang hiện tại (mặc định 1)
  - `limit`: Số lượng học sinh mỗi trang (mặc định 50)
  - `search`: Tìm kiếm theo tên hoặc mã học sinh
- **Logic xử lý (Tối ưu hiệu năng):**
  1. Lấy danh sách học sinh (phân trang) từ bảng `User` kèm theo `studentProfile` và `userStats`.
  2. Dùng ID của các học sinh trong trang hiện tại để query song song 4 truy vấn `.groupBy` (hoặc raw SQL):
     - Lấy số lượng Chat: Nhóm theo `userId` từ `ChatSession` -> `ChatMessage`.
     - Lấy số lượng Mindmap: Nhóm theo `userId` từ `ActivityLog` (action = 'Xem sơ đồ tư duy').
     - Lấy số lượng Flashcard: Nhóm theo `userId` từ `ActivityLog` (action = 'Xem bộ Flashcard').
     - Lấy số lượng Đấu trường: Nhóm theo `userId` từ `ArenaResult`.
  3. Gộp kết quả trả về cho Frontend.

---

## 4. Các bước triển khai (Implementation Steps)

### PHASE 1: Backend API
1. **`server/services/report.service.ts`**:
   - Viết hàm `getStudentActivityStats(page, limit, search)`.
   - Kết hợp Prisma `findMany` cho danh sách User và Prisma `groupBy` cho các bảng lịch sử tương ứng.
2. **`server/controllers/report.controller.ts`**:
   - Viết controller gọi service trên và trả về kết quả.
3. **`server/routes/report.routes.ts`**:
   - Định nghĩa route `GET /student-stats` và viết Swagger document.

### PHASE 2: Frontend UI
1. **`client/src/features/admin/analytics/services/report.service.ts`**:
   - Bổ sung hàm fetch API `getStudentStats()`.
2. **`client/src/features/admin/analytics/Student-Stats-Index.tsx`**:
   - Tạo trang danh sách hiển thị bảng số liệu.
   - Bảng (DataTable) hiển thị đầy đủ 7 cột thông tin như ảnh thiết kế.
   - Có thêm thanh công cụ tìm kiếm và phân trang ở dưới.
3. **Menu Điều hướng**:
   - Cập nhật menu bên trái của layout Admin để hiển thị mục "Thống kê Học sinh".

---

## 5. Câu hỏi dành cho bạn

> [!IMPORTANT]
> **1. Về vị trí đặt trang:** Bạn có đồng ý đặt nó ở mục **Báo cáo (Analytics)** như tôi đề xuất thay vì ghép vào màn Quản lý User hiện tại không?
> **2. Nguồn dữ liệu Mindmap/Flashcard:** Hiện tại bảng `ActivityLog` chỉ lưu action "Xem sơ đồ tư duy" / "Xem bộ Flashcard" khi user mở ra đọc. Chúng ta sẽ đếm số lượt xem này làm dữ liệu "Hoàn thành / Đã học" như trong bảng thiết kế nhé?

**Hãy xác nhận các câu hỏi và gõ "Bắt đầu" để tiến hành code.**
