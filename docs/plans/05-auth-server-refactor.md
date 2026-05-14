# Auth Server Refactor - Phase 1

Tài liệu này ghi lại quyết định kiến trúc cho giai đoạn chuyển Auth từ Firebase sang Backend riêng dùng PostgreSQL.

## Mục tiêu pha 1
- Backend sở hữu hoàn toàn logic xác thực.
- Dữ liệu người dùng đi vào PostgreSQL qua Prisma.
- Học sinh không tự đăng ký tự do; tài khoản được nhà trường tạo sẵn rồi kích hoạt lần đầu.
- Giáo viên/Admin có luồng đăng nhập riêng.
- Toàn bộ session được quản lý từ server.

## Mô hình tài khoản
- `ADMIN`: khởi tạo hệ thống, quản trị người dùng, phân quyền.
- `TEACHER`: quản lý học sinh, tài liệu, hoạt động học tập.
- `STUDENT`: dùng để học tập, làm quiz, chat, tham gia arena.

## Flow nghiệp vụ mới
1. Hệ thống bootstrap 1 tài khoản `ADMIN` đầu tiên qua `POST /api/auth/bootstrap-admin`.
2. Admin tạo sẵn tài khoản học sinh/giáo viên qua `POST /api/auth/users/provision`.
3. Hệ thống trả ra `activationCode` một lần để nhà trường phát cho người dùng.
4. Người dùng kích hoạt tài khoản lần đầu qua `POST /api/auth/activate`.
5. Sau khi kích hoạt, người dùng đăng nhập bằng:
   - `POST /api/auth/student/login`
   - `POST /api/auth/teacher/login`
6. Client dùng `accessToken` cho API thường và `refreshToken` để làm mới phiên.

## Schema nền tảng đã thêm
- `User`
- `StudentProfile`
- `TeacherProfile`
- `Class`
- `AuthSession`
- `UserStats`
- `XpLog`

## Gợi ý UI tương ứng cho FE
- Màn hình 1: `Đăng nhập học sinh`
- Màn hình 2: `Kích hoạt tài khoản lần đầu`
- Màn hình 3: `Đăng nhập giáo viên`
- Màn hình 4: `Thông báo liên hệ giáo viên khi quên mật khẩu`

## Các pha tiếp theo nên làm
1. Tạo module quản trị lớp học và provisioning tài khoản trên FE.
2. Chuyển `messages`, `quizzes`, `arena_results`, `students` từ Firebase sang PostgreSQL.
3. Chuyển toàn bộ gọi Gemini qua server và bỏ `VITE_GEMINI_API_KEY` khỏi frontend.
4. Khi module học tập đã dùng API server ổn định, mới xóa hẳn Firebase khỏi client.
