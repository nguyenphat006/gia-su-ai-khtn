# Kế hoạch Tích hợp Frontend (Client UI)

Bản kế hoạch này tập trung vào 2 mục tiêu chính: Ưu tiên gắn API vào giao diện Chat đã có sẵn để test ngay lập tức, và sau đó xây dựng trang Quản trị AI (`/admin`).

## 1. Ưu Tiên 1: Tích hợp API vào Giao diện Chat Hiện Tại

Dựa vào việc `client/src/features/chat/` đã có sẵn UI, tôi sẽ tiến hành:

1. **Tạo `chat.service.ts` (Client):** 
   - Viết các hàm fetch dùng Axios/Fetch (`getSessions`, `getSessionMessages`, `sendMessage`, `createSession`).
2. **Cập nhật `useChat.ts`:** 
   - Thay thế logic mock data cũ bằng việc gọi API thực tế.
   - Thêm logic báo hiệu nhận 10 EXP khi tin nhắn được gửi đi thành công (sử dụng thư viện Toast/Sonner có sẵn của dự án).
3. **Chỉnh sửa `ChatFeature.tsx` (Nếu cần):**
   - Ráp nối việc gửi tin nhắn (kèm ảnh base64 nếu UI đã có nút đính kèm).
   - Test thực tế luồng Chat ngay lập tức.

## 2. Ưu Tiên 2: Xây Dựng Trang Quản Trị AI (`/admin`)

Tạo một feature mới tại `client/src/features/admin/` dành riêng cho việc quản trị hệ thống.

1. **Routing (`/admin`):** 
   - Đăng ký route `/admin` (được bảo vệ bởi `AdminRoute/TeacherRoute`).
2. **Giao diện Top Header Menu:**
   - Dùng Tailwind CSS xây dựng Navbar đơn giản, hiện đại trên cùng (`[ Quản lý AI ] | [ Quản lý Tài Khoản ] | [ Lớp Học ]`).
3. **Module Cấu hình AI (`/admin/ai-config`):**
   - Form có Textarea để load nội dung `AI_SYSTEM_PROMPT` từ `GET /api/system/configs/AI_SYSTEM_PROMPT`.
   - Bấm Save gọi `PUT` để cập nhật Prompt thời gian thực.
4. **Module Kho Tri Thức (`/admin/knowledge`):**
   - Hiển thị danh sách các bài học đã nạp vào Database.
   - Cung cấp nút "Thêm dữ liệu" mở Modal để dán nội dung bài giảng. Bấm lưu gọi `POST /api/knowledge`.

## 3. Verification Plan

- Đăng nhập học sinh -> Mở Chat hiện tại -> Nhắn tin -> Phản hồi có chuẩn LaTeX và có cộng 10 EXP.
- Đăng nhập Admin -> Mở `/admin` -> Sửa Prompt -> Chuyển sang Học sinh chat lại xem tính cách AI có thay đổi theo không.
