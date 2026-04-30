import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

/**
 * Lấy giá trị của một cấu hình hệ thống
 * @param key Khóa cấu hình (vd: "AI_SYSTEM_PROMPT")
 * @returns Giá trị cấu hình, hoặc undefined nếu chưa tồn tại
 */
export async function getSystemConfig(key: string): Promise<string | undefined> {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });
  return config?.value;
}

/**
 * Lấy tất cả cấu hình hệ thống
 */
export async function getAllSystemConfigs() {
  const configs = await prisma.systemConfig.findMany({
    orderBy: { updatedAt: "desc" },
  });
  
  return {
    configs,
    total: configs.length
  };
}

/**
 * Tạo mới một cấu hình hệ thống
 */
export async function createSystemConfig(key: string, value: string, userId: string) {
  const existing = await prisma.systemConfig.findUnique({ where: { key } });
  if (existing) {
    throw new ConflictError("Khóa cấu hình này đã tồn tại.");
  }

  return prisma.systemConfig.create({
    data: {
      key,
      value,
      updatedBy: userId,
    },
  });
}

/**
 * Cập nhật hoặc tạo mới một cấu hình hệ thống (Upsert)
 */
export async function upsertSystemConfig(key: string, value: string, userId: string) {
  return prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      updatedBy: userId,
    },
    create: {
      key,
      value,
      updatedBy: userId,
    },
  });
}

/**
 * Xóa một cấu hình hệ thống
 */
export async function deleteSystemConfig(key: string) {
  const existing = await prisma.systemConfig.findUnique({ where: { key } });
  if (!existing) {
    throw new NotFoundError("Không tìm thấy cấu hình hệ thống.");
  }

  await prisma.systemConfig.delete({ where: { key } });
  return { message: "Xóa cấu hình thành công." };
}

// Khởi tạo Prompt Mặc định nếu DB chưa có
const DEFAULT_PROMPT = `Bạn là một "Gia sư AI chuyên nghiệp" chuyên hỗ trợ học sinh học tập môn Khoa học tự nhiên (KHTN). Phong cách giao tiếp của bạn phải thân thiện, dễ hiểu, phù hợp với lứa tuổi học sinh trung học, nhưng vẫn đảm bảo tính chính xác khoa học tuyệt đối.

Nguồn dữ liệu duy nhất và ưu tiên của bạn là sách giáo khoa Khoa học tự nhiên 6, 7, 8, 9 - Chân trời sáng tạo (Nhà xuất bản Giáo dục Việt Nam, được Bộ Giáo dục và Đào tạo phê duyệt).
Bạn phải bám sát chương trình, thuật ngữ và cách giải thích trong bộ sách này để trả lời học sinh.

QUY TẮC TRÌNH BÀY:
- Sử dụng Markdown rõ ràng.
- Các biểu thức khoa học, công thức toán học bắt buộc phải đặt trong chuẩn LaTeX ($...$ hoặc $$...$$). KHÔNG dùng ngoặc đơn hay ngoặc vuông kiểu \\( \\) hay \\[ \\].
- Luôn kết thúc bằng một mục riêng biệt ghi "ĐÁP ÁN" để học sinh nắm rõ kết quả sau cùng.

Ngữ cảnh tài liệu đính kèm: {context}`;

export async function ensureDefaultPrompt() {
  const existing = await getSystemConfig("AI_SYSTEM_PROMPT");
  if (!existing) {
    await prisma.systemConfig.create({
      data: {
        key: "AI_SYSTEM_PROMPT",
        value: DEFAULT_PROMPT,
        updatedBy: "system",
      },
    });
  }
}
