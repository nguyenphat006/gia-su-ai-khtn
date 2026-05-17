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
 * Xóa nhiều cấu hình hệ thống
 */
export async function deleteSystemConfigs(keys: string[]) {
  const result = await prisma.systemConfig.deleteMany({
    where: { key: { in: keys } },
  });

  if (result.count === 0) {
    throw new NotFoundError("Không tìm thấy cấu hình nào để xoá.");
  }

  return { message: `Xóa thành công ${result.count} cấu hình.` };
}

/**
 * Ghi nhật ký hoạt động hệ thống thủ công (Helper)
 */
export async function recordSystemActivity(data: {
  userId?: string | null;
  username?: string | null;
  role?: string | null;
  module: string;
  action: string;
  source: string;
  method?: string;
  path?: string;
  statusCode?: number;
  queryParams?: any;
  requestBody?: any;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId || null,
        username: data.username || null,
        userRole: data.role || null,
        source: data.source,
        module: data.module,
        action: data.action,
        method: data.method || "SYSTEM",
        path: data.path || "background-task",
        statusCode: data.statusCode || 200,
        durationMs: 0,
        queryParams: data.queryParams || null,
        requestBody: data.requestBody || null,
      }
    });
  } catch (err) {
    console.error("Lỗi khi ghi ActivityLog hệ thống:", err);
  }
}

// Khởi tạo Prompt Mặc định nếu DB chưa có
const DEFAULT_PROMPT = `Bạn là một "Gia sư AI chuyên nghiệp" chuyên hỗ trợ học sinh học tập môn Khoa học tự nhiên (KHTN). Phong cách giao tiếp của bạn phải thân thiện, dễ hiểu, phù hợp với lứa tuổi học sinh trung học, nhưng vẫn đảm bảo tính chính xác khoa học tuyệt đối.

Nguồn dữ liệu duy nhất và ưu tiên của bạn là sách giáo khoa Khoa học tự nhiên 6, 7, 8, 9 - Chân trời sáng tạo (Nhà xuất bản Giáo dục Việt Nam, được Bộ Giáo dục và Đào tạo phê duyệt).
Bạn phải bám sát chương trình, thuật ngữ và cách giải giải thích trong bộ sách này để trả lời học sinh.

QUY TẮC TRÌNH BÀY:
- Sử dụng Markdown rõ ràng.
- Các biểu thức khoa học, công thức toán học bắt buộc phải đặt trong chuẩn LaTeX ($...$ hoặc $$...$$). KHÔNG dùng ngoặc đơn hay ngoặc vuông kiểu \\( \\) hay \\[ \\].
- Luôn kết thúc bằng một mục riêng biệt ghi "ĐÁP ÁN" để học sinh nắm rõ kết quả sau cùng.

Ngữ cảnh tài liệu đính kèm: {context}`;

const DEFAULT_GUARD_PROMPT = `Đánh giá nội dung tin nhắn sau của người dùng có vi phạm chuẩn mực đạo đức, thuần phong mỹ tục, chửi thề, thô tục, hoặc nội dung không phù hợp với môi trường giáo dục không?
Bạn phải trả lời duy nhất ở định dạng JSON:
{"violated": boolean, "reason": "lý do ngắn gọn nếu vi phạm"}

Nội dung cần đánh giá:
{message}`;

export async function ensureDefaultConfigs() {
  const configs = [
    { key: "AI_SYSTEM_PROMPT", value: DEFAULT_PROMPT },
    { key: "LOG_RETENTION_DAYS", value: "90" },
    { key: "AI_MODEL", value: "gemini-3.1-flash-lite-preview" },
    { key: "AI_TEMPERATURE", value: "0.7" },
    { key: "AI_GUARD_ENABLED", value: "true" },
    { key: "AI_GUARD_PROMPT", value: DEFAULT_GUARD_PROMPT },
    { key: "AI_GUARD_MODEL", value: "gemini-3.1-flash-lite-preview" },
    { key: "AI_GUARD_XP_PENALTY_BASE", value: "20" },
    { key: "AI_GUARD_BLOCK_MESSAGE", value: "Tin nhắn của em chứa nội dung không phù hợp và đã bị hệ thống chặn. Hãy tập trung vào việc học tập môn KHTN nhé! Lần vi phạm này sẽ bị trừ XP." },
    { key: "AI_MAX_HISTORY_MESSAGES", value: "10" },
  ];

  for (const config of configs) {
    const existing = await getSystemConfig(config.key);
    if (!existing) {
      await prisma.systemConfig.create({
        data: {
          key: config.key,
          value: config.value,
          updatedBy: "system",
        },
      });
    }
  }
}
