# Kế hoạch: Trang Chi Tiết Học Sinh (Student Detail Page)

> **Ngày tạo:** 2026-05-18
> **Trạng thái:** 📝 Đang lên kế hoạch

---

## 1. Yêu cầu & Mục tiêu

Sau khi có "Bảng Thống Kê Hoạt Động Học Sinh" (danh sách), quản trị viên cần có khả năng **click vào một học sinh** để xem thông tin chi tiết của học sinh đó.

**Mục tiêu:**
- Tạo một màn hình chi tiết tại route: `/admin/analytics/students/:id`.
- Layout chia làm 2 phần:
  - **Cột Trái (Card Thông Tin):** Hiển thị Avatar, Tên, Mã HS, Lớp, và các chỉ số tổng quan (EXP, Chuỗi ngày học).
  - **Cột Phải (Tabs Chi Tiết):** Hiển thị danh sách các hoạt động chi tiết của học sinh đó, chia thành các Tab: Arena, Ôn tập, Hội thoại AI, và Lịch sử hoạt động chung.

---

## 2. Thiết kế Giao diện (UI Layout)

**File:** `client/src/features/admin/analytics/Student-Detail-Index.tsx`

### Cột Trái: Card Thông Tin Cá Nhân (30% width)
- **Header:** Nút Back (Quay lại danh sách).
- **Avatar & Info:** Avatar to tròn ở giữa, Tên hiển thị (Bold), Username (@username).
- **Meta Data (Dạng list):**
  - Trạng thái tài khoản (Badge màu Xanh lá/Đỏ)
  - Khối Lớp, Lớp (Ví dụ: Khối 6 - Lớp 6A1)
  - Mã Học Sinh
- **Summary Stats (2 blocks):**
  - Tổng EXP (Icon tia chớp vàng)
  - Chuỗi ngày học hiện tại & Dài nhất (Icon ngọn lửa đỏ)

### Cột Phải: Tabs Hoạt Động Chi Tiết (70% width)
Sử dụng component `Tabs` để chuyển đổi giữa các view:

- **Tab 1: Đấu trường Arena (Danh sách PvP & AI)**
  - Hiển thị bảng kết quả các trận Arena học sinh đã tham gia (Thắng/Thua, Điểm, EXP nhận được, Đối thủ, Chủ đề).
- **Tab 2: Ôn tập (Quiz, Flashcard, Mindmap)**
  - Hiển thị bảng nhật ký học tập trong module Revision (Làm bài trắc nghiệm nào, Xem sơ đồ tư duy nào, Thời gian thực hiện).
- **Tab 3: Hội thoại AI (Chat Logs)**
  - Hiển thị danh sách các câu hỏi học sinh đã hỏi Gia sư AI.
- **Tab 4: Toàn bộ Lịch sử (Activity Logs)**
  - Một dòng thời gian (Timeline) hoặc Bảng tất cả mọi click/tương tác của học sinh (đăng nhập, nhận thưởng...).

---

## 3. Kiến trúc API (Data Fetching Strategy)

Tin tốt là **chúng ta không cần viết thêm API mới ở Backend**! Toàn bộ dữ liệu này có thể được fetch thông qua các API hiện có bằng cách truyền param `userId`.

| Dữ liệu hiển thị | API Endpoint sử dụng |
|---|---|
| Card Thông tin (Trái) | `GET /api/users/:id` |
| Tab: Đấu trường | `GET /api/reports/arena-logs?userId=:id` |
| Tab: Hội thoại AI | `GET /api/reports/chat-logs?userId=:id` |
| Tab: Ôn tập | `GET /api/reports/activity-logs?userId=:id&module=revision` |
| Tab: Toàn bộ Lịch sử | `GET /api/reports/activity-logs?userId=:id` |

---

## 4. Các bước Triển khai

### Bước 1: Routing Frontend
- Thêm route chi tiết vào App Router: `<Route path="students/:id" element={<StudentDetailIndex />} />`.

### Bước 2: Frontend Services
- Trong `client/src/features/admin/analytics/services/report.service.ts`:
  - Thêm các hàm bọc lại các endpoint trên nếu chưa có (truyền `userId`).
- Hoặc dùng trực tiếp service của `user-management` cho API lấy user.

### Bước 3: Tạo Component
- Tạo thư mục con: `client/src/features/admin/analytics/components/student-detail/`.
- Tạo các component con:
  - `StudentProfileCard.tsx` (Bên trái).
  - `StudentArenaTab.tsx` (Render DataTable cho Arena).
  - `StudentRevisionTab.tsx` (Render DataTable cho ActivityLog module revision).
  - `StudentChatTab.tsx` (Render DataTable cho Chat logs).
- Tạo trang chính `Student-Detail-Index.tsx` ghép nối các thành phần.

### Bước 4: Tích hợp từ danh sách
- Sửa trang `Student-Stats-Index.tsx` (Bảng Thống kê Học sinh đã lên plan trước): thêm Action/Link ở cột Tên Học sinh hoặc cột Action cuối cùng để redirect sang `/admin/analytics/students/:id`.

---

## Câu hỏi Xác nhận

> [!IMPORTANT]
> 1. Cách tái sử dụng API này rất tối ưu cho Backend vì không phải viết thêm logic phức tạp. Bạn có đồng ý với chiến lược fetch data này không?
> 2. Về UI Tabs cột phải, bạn có muốn thêm Tab nào khác không (ví dụ Tab Thống kê biểu đồ)?

**Hãy xem lại và gõ "Bắt đầu" để chúng ta thực hiện theo tuần tự: Code trang Danh sách (Plan 1) -> Code trang Chi tiết (Plan 2).**
