# Prisma & Backend Commands

Tài liệu này dùng làm sổ tay thao tác nhanh cho Backend và Prisma của dự án `Gia sư AI KHTN`.

## 1. Chạy backend

Từ thư mục [server](/D:/Coder/Github/ERICSS/gia-su-ai-khtn/server):

```powershell
npm.cmd install
npm.cmd run dev
```

Build production:

```powershell
npm.cmd run build
npm.cmd start
```

Kiểm tra TypeScript:

```powershell
npm.cmd run lint
```

## 2. Chuẩn bị biến môi trường

Tạo file `.env` trong thư mục `server/` và cấu hình tối thiểu:

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public

JWT_SECRET=replace_with_a_long_random_secret
ADMIN_BOOTSTRAP_KEY=replace_with_a_private_bootstrap_key
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=7

GEMINI_API_KEY=your_gemini_api_key
```

## 3. Prisma commands quan trọng

Sinh Prisma Client:

```powershell
npm.cmd run prisma:generate
```

Kiểm tra schema hợp lệ:

```powershell
npm.cmd run prisma:validate
```

Tạo migration mới trong môi trường local và áp luôn xuống DB:

```powershell
npm.cmd run prisma:migrate:dev -- --name init_auth_server
```

Áp toàn bộ migration đã có xuống DB khác:

```powershell
npm.cmd run prisma:migrate:deploy
```

Đẩy schema thẳng xuống DB mà không tạo migration:

```powershell
npm.cmd run prisma:push
```

Mở Prisma Studio:

```powershell
npm.cmd run prisma:studio
```

## 4. Luồng làm việc chuẩn với Prisma

### Khi chỉnh `schema.prisma`
1. Sửa file [schema.prisma](/D:/Coder/Github/ERICSS/gia-su-ai-khtn/server/prisma/schema.prisma)
2. Validate schema:

```powershell
npm.cmd run prisma:validate
```

3. Tạo migration:

```powershell
npm.cmd run prisma:migrate:dev -- --name ten_thay_doi
```

4. Generate lại client nếu cần:

```powershell
npm.cmd run prisma:generate
```

5. Kiểm tra backend compile:

```powershell
npm.cmd run lint
npm.cmd run build
```

### Khi deploy server lên môi trường khác
1. Cấu hình `.env`
2. Cài dependencies
3. Chạy migration:

```powershell
npm.cmd run prisma:migrate:deploy
```

4. Khởi động server:

```powershell
npm.cmd run build
npm.cmd start
```

## 5. Các lệnh hữu ích cho auth

Bootstrap tài khoản admin đầu tiên:

```http
POST /api/auth/bootstrap-admin
```

Tạo sẵn tài khoản học sinh/giáo viên:

```http
POST /api/auth/users/provision
Authorization: Bearer <access_token>
```

Kích hoạt tài khoản lần đầu:

```http
POST /api/auth/activate
```

Đăng nhập học sinh:

```http
POST /api/auth/student/login
```

Đăng nhập giáo viên:

```http
POST /api/auth/teacher/login
```

## 6. Swagger

Swagger chạy tại:

```text
http://localhost:3001/api-docs
```

Có thể dùng nút `Authorize` để dán Bearer token và test các API protected.

## 7. Lưu ý quan trọng

- `prisma:migrate:dev` dùng tốt cho local development.
- `prisma:migrate:deploy` dành cho môi trường đã có migration sẵn và cần apply an toàn.
- `prisma:push` chỉ nên dùng khi bạn chủ động bỏ qua lịch sử migration.
- Sau mỗi lần đổi schema hoặc auth flow, nên chạy lại:

```powershell
npm.cmd run prisma:validate
npm.cmd run lint
npm.cmd run build
```

## 8. Troubleshooting thường gặp

### Lỗi `password authentication failed`
- Kiểm tra lại `DATABASE_URL` trong `server/.env`
- Thử đăng nhập trực tiếp DB bằng đúng `user/password` đó
- Xác nhận database user có quyền truy cập database mục tiêu

Ví dụ:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public
```

### Lỗi `Schema engine error` khi chạy `prisma migrate dev`
Nguyên nhân thường gặp:
- User DB không có quyền tạo `shadow database`
- `DATABASE_URL` sai
- PostgreSQL đang chạy nhưng user không đủ quyền

Cách xử lý:
1. Sửa lại `DATABASE_URL`
2. Cấp thêm quyền cho DB user
3. Nếu chỉ cần đồng bộ schema nhanh, có thể tạm dùng:

```powershell
npm.cmd run prisma:push
```

### Khi đã có migration trong repo nhưng DB còn trống
Chạy:

```powershell
npm.cmd run prisma:migrate:deploy
```

Nếu DB chưa đăng nhập được thì phải sửa kết nối trước, Prisma sẽ không tự vượt qua lỗi auth của PostgreSQL.
