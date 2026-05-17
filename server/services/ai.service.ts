import { GoogleGenAI } from "@google/genai";
import { getSystemConfig } from "./system.service.js";

// Đảm bảo có API KEY từ biến môi trường
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

// Cấu hình model tập trung (Fallback)
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

export interface GeminiMessage {
  role: "user" | "model";
  parts: any[];
}

/**
 * Gọi AI chính để trả lời câu hỏi học sinh
 */
export async function askGemini(
  message: string,
  history: GeminiMessage[],
  context: string,
  image?: { data: string; mimeType: string }
): Promise<string> {
  // 1. Lấy cấu hình từ DB
  const [systemPrompt, aiModel, aiTemp] = await Promise.all([
    getSystemConfig("AI_SYSTEM_PROMPT"),
    getSystemConfig("AI_MODEL"),
    getSystemConfig("AI_TEMPERATURE"),
  ]);

  let promptTemplate = systemPrompt || `Bạn là Gia sư AI chuyên nghiệp. Nguồn dữ liệu: KHTN Chân trời sáng tạo.\n\nNgữ cảnh: {context}`;

  // Nhúng ngữ cảnh vào Prompt
  const systemInstruction = promptTemplate.replace(
    "{context}",
    context || "Chưa có tài liệu được nạp phù hợp."
  );

  const model = aiModel || DEFAULT_GEMINI_MODEL;
  const temperature = aiTemp ? parseFloat(aiTemp) : 0.7;

  const parts: any[] = [{ text: message }];
  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: "user", parts },
      ],
      config: {
        systemInstruction,
        temperature,
      },
    });

    return response.text || "Xin lỗi, tôi không thể tạo phản hồi lúc này.";
  } catch (error: any) {
    console.error("Gemini API Error in askGemini:", error);
    if (
      error?.status === "RESOURCE_EXHAUSTED" ||
      error?.status === 429 ||
      error?.message?.includes("exceeded your current quota")
    ) {
      return "Hệ thống AI đang quá tải hoặc đã hết lượt kết nối miễn phí hôm nay. Xin lỗi em, em vui lòng quay lại sau nhé!";
    }
    return "Có lỗi xảy ra khi kết nối. Xin vui lòng thử lại sau.";
  }
}

/**
 * Kiểm duyệt nội dung tin nhắn (Guard Model)
 */
export async function checkContentGuard(message: string): Promise<{ violated: boolean; reason?: string }> {
  try {
    const [enabled, guardPrompt, guardModel] = await Promise.all([
      getSystemConfig("AI_GUARD_ENABLED"),
      getSystemConfig("AI_GUARD_PROMPT"),
      getSystemConfig("AI_GUARD_MODEL"),
    ]);

    if (enabled !== "true") return { violated: false };

    const model = guardModel || DEFAULT_GEMINI_MODEL;
    const prompt = (guardPrompt || "").replace("{message}", message);

    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1, // Cần độ chính xác cao, ít sáng tạo
        responseMimeType: "application/json",
      },
    });

    const text = result.text;
    if (!text) return { violated: false };

    const parsed = JSON.parse(text);
    return {
      violated: !!parsed.violated,
      reason: parsed.reason || "Nội dung không phù hợp",
    };
  } catch (error) {
    console.error("Lỗi khi kiểm duyệt nội dung bằng AI Guard:", error);
    // Nếu guard lỗi, tạm thời cho qua để không chặn người dùng oan, hoặc có thể chọn chặn tất cả tùy chính sách
    return { violated: false };
  }
}
