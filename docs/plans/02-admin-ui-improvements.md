# Kế hoạch Cải thiện Giao diện & Cấu trúc Quản trị (Admin UI)

Tài liệu này vạch ra các bước thực hiện để chuẩn hoá cấu trúc thư mục và nâng cấp giao diện cho khu vực Quản trị (`/admin`) của dự án Gia sư AI KHTN.

## 1. Tái cấu trúc thư mục `features/admin`
Hiện tại các trang quản trị đang đặt chung trong `features/admin/components`. Việc này sẽ khó quản lý khi hệ thống mở rộng (ví dụ: quản lý Users, Classes, Analytics).
**Hành động:**
- Chia nhỏ `features/admin` thành các thư mục module riêng biệt (Feature-Sliced Design):
  - `features/admin/system/` (chứa UI quản lý Prompt & Config)
  - `features/admin/knowledge/` (chứa UI quản lý RAG Data)
  - `features/admin/users/` (dự trù cho quản lý người dùng sau này)
  - `features/admin/classes/` (dự trù cho quản lý lớp học sau này)
- Di chuyển `SystemConfigTab.tsx` sang `features/admin/system/SystemConfigFeature.tsx`.
- Di chuyển `KnowledgeBaseTab.tsx` sang `features/admin/knowledge/KnowledgeBaseFeature.tsx`.

## 2. Thêm lối tắt vào Trang Quản Trị từ Client Header
Để Admin/Teacher không phải gõ URL bằng tay `/admin`, ta sẽ tích hợp menu điều hướng ngay ở giao diện người dùng.
**Hành động:**
- Mở component `Header.tsx` (hoặc `ProfileDropdown.tsx` tuỳ cấu trúc hiện tại) của phía User.
- Thêm điều kiện kiểm tra `isAdmin` hoặc `user.role === 'TEACHER' || user.role === 'ADMIN'`.
- Nếu thoả mãn, thêm một mục **"Truy cập trang quản trị"** (kèm icon Settings hoặc Dashboard) vào menu dropdown. Khi click sẽ redirect sang `/admin`.

## 3. Thiết kế lại Admin Layout (Top Menu Header)
Giao diện Layout của Admin hiện tại quá cơ bản. Cần nâng cấp thành một thanh Top Header tiêu chuẩn, đẹp và chuyên nghiệp hơn, mang đậm chất Dashboard quản lý.
**Hành động:**
- Thay đổi `AdminLayout.tsx`:
  - **Khu vực Logo/Thương hiệu:** Chứa logo KHTN và tên "Hệ thống Quản trị Gia sư AI".
  - **Menu Điều hướng ngang (Top Nav):** Sử dụng thiết kế dạng tab (hoặc menu pill) nằm giữa hoặc canh trái, hiển thị active rõ ràng, có kèm Icon trực quan.
  - **Khu vực User Profile (bên phải):** Hiển thị Avatar, tên người quản trị và menu thả xuống (Dropdown) để chọn quay lại trang chủ hoặc Đăng xuất.
  - Thêm hiệu ứng hover, shadow, và canh chỉnh spacing (padding/margin) tinh tế, đảm bảo layout có một header cố định phía trên và phần nội dung cuộn bên dưới một cách mượt mà.
  - Bổ sung Breadcrumb (tuỳ chọn) để người quản trị biết mình đang ở trang nào.

---

**Trạng thái:** Chờ duyệt để bắt đầu triển khai ngay.
