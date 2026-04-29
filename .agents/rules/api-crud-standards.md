---
name: api-crud-standards
description: Quy chuẩn bắt buộc khi phát triển API CRUD mới trong hệ thống. Bao gồm cấu trúc Response dùng chung, phân trang (Pagination) và tiêu chuẩn viết tài liệu Swagger đầy đủ.
---

# Tiêu chuẩn phát triển API CRUD

Tài liệu này định nghĩa các quy tắc **bắt buộc** phải tuân thủ khi viết bất kỳ API nào trên Backend để đảm bảo tính đồng nhất, khả năng bảo trì và tự động hóa sinh tài liệu (Swagger).

## 1. Cấu trúc Response Chuẩn (Standard Response Format)

Tất cả các API trả về phải tuân thủ chặt chẽ cấu trúc JSON sau để phía Client có thể dùng chung một `BaseResponse` interface:

```typescript
// Thành công cơ bản (Get, Create, Update, Delete)
{
  "status": "success",
  "message": "Thao tác thành công", // Tùy chọn
  "data": { ... } // Dữ liệu trả về (Object hoặc Array)
}

// Thành công có phân trang (Pagination)
{
  "status": "success",
  "data": { 
    "items": [ ... ], // Mảng dữ liệu
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}

// Lỗi (Sử dụng hệ thống Error Handler tập trung)
{
  "status": "error",
  "message": "Mô tả chi tiết lỗi",
  "code": "ERROR_CODE" // Tùy chọn
}
```

## 2. Tiêu chuẩn viết Swagger Documentation

Tuyệt đối **KHÔNG** chỉ viết `summary` và `tags` cho có lệ. Một API chuẩn trên Swagger bắt buộc phải có đầy đủ các thành phần để Frontend có thể "Try it out" ngay lập tức mà không cần hỏi Backend.

### 2.1. API GET (Lấy dữ liệu / Phân trang)
- Bắt buộc khai báo `parameters` (query strings) như `page`, `limit`, `search`, `sortBy`.
- Bắt buộc khai báo `responses` (200).

```yaml
/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Lấy danh sách tài nguyên
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng item trên 1 trang
 *     responses:
 *       200:
 *         description: Danh sách kèm phân trang
 */
```

### 2.2. API POST / PUT (Tạo mới / Cập nhật)
- Bắt buộc phải có `requestBody` với `schema` và `example` rõ ràng.
- Bắt buộc định nghĩa các trường `required`.
- Bắt buộc có `responses` (201 cho Create, 200 cho Update).

```yaml
/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Tạo tài nguyên mới
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dữ liệu mẫu"
 *               type:
 *                 type: string
 *                 example: "TEXT"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 */
```

### 2.3. API DELETE / GET by ID
- Bắt buộc khai báo `parameters` với `in: path`.

## 3. Quy tắc Code ở Controller & Service

1. **Service chỉ xử lý Logic & DB:** Service nhận tham số đầu vào thuần (không nhận `req`, `res`) và trả ra Data thuần hoặc ném ra Error.
2. **Xử lý phân trang ở Service:** Service phải trả ra object gồm `{ items, total }`. Controller sẽ tính toán `totalPages` dựa trên `limit`.
3. **Controller bắt lỗi bằng `next(error)`:** Mọi try-catch trong Controller đều đưa lỗi vào `next(error)` để Middleware xử lý lỗi tổng bắt được và format về chuẩn `{ status: "error" }`.
4. **Validation:** Controller có trách nhiệm kiểm tra `req.body`, `req.query` (bằng Zod, Joi hoặc logic thường) trước khi gọi Service.
