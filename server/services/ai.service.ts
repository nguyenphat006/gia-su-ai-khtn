import { GoogleGenAI } from "@google/genai";
import { getSystemConfig } from "./system.service.js";

// Đảm bảo có API KEY từ biến môi trường
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

export interface GeminiMessage {
  role: "user" | "model";
  parts: any[];
}

export async function askGemini(
  message: string,
  history: GeminiMessage[],
  context: string,
  image?: { data: string; mimeType: string }
): Promise<string> {
  // Lấy Prompt từ DB, nếu không có thì fallback tạm thời (Dù system.service đã chặn điều này bằng ensureDefaultPrompt)
  let systemPrompt = await getSystemConfig("AI_SYSTEM_PROMPT");
  if (!systemPrompt) {
    systemPrompt = `Bạn là Gia sư AI. Nguồn dữ liệu: KHTN Chân trời sáng tạo.\n\nNgữ cảnh: {context}`;
  }

  // Nhúng ngữ cảnh vào Prompt
  const systemInstruction = systemPrompt.replace(
    "{context}",
    context || "Chưa có tài liệu được nạp phù hợp."
  );

  // model: Flash-8B cho xử lý ảnh (rẻ, nhanh), Flash thường cho text
  const model = image ? "gemini-1.5-flash-8b" : "gemini-3-flash-preview";

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
        temperature: 0.7,
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
