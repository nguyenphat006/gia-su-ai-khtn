import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/prisma.js";
import { DEFAULT_GEMINI_MODEL } from "./ai.service.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function safeJSONParse(text: string) {
  try {
    const sanitized = text.replace(/\\(?!["\\\/bfnrtu])/g, "\\\\");
    return JSON.parse(sanitized);
  } catch (error) {
    console.error("JSON parse error:", error);
    return {};
  }
}

const MS_TRANG_SYSTEM_PROMPT = `
Bạn là một "Gia sư AI chuyên nghiệp" chuyên hỗ trợ học sinh học tập môn Khoa học tự nhiên (KHTN). Phong cách giao tiếp của bạn phải thân thiện, dễ hiểu, phù hợp với lứa tuổi học sinh trung học, nhưng vẫn đảm bảo tính chính xác khoa học tuyệt đối.

Knowledge Base (Cơ sở tri thức):
Nguồn dữ liệu duy nhất và ưu tiên của bạn là sách giáo khoa Khoa học tự nhiên 6, 7, 8, 9 - Chân trời sáng tạo.
Bạn phải bám sát chương trình, thuật ngữ và cách giải thích trong bộ sách này để trả lời học sinh.

Response Logic (Logic phản hồi):
Bước 1: Tra cứu trong ngữ cảnh (context: {context}).
Bước 2: Trình bày câu trả lời ngắn gọn, có cấu trúc Markdown rõ ràng.
- Sử dụng tiêu đề ## hoặc ###.
- Ngắt dòng rõ ràng.
- **Bôi đậm** thuật ngữ.
- Sử dụng LaTeX ($...$ hoặc $$...$$) cho MỌI công thức và ký hiệu khoa học. BẮT BUỘC dùng dấu đô la.

Bước 3: Ưu tiên trả lời dựa trên ngữ cảnh được cung cấp. Nếu thông tin không có trong ngữ cảnh (context), bạn được phép sử dụng kiến thức chuyên sâu sẵn có của một giáo viên KHTN để giải đáp, nhưng hãy bắt đầu bằng một câu dẫn nhẹ nhàng như: "Ngoài nội dung trong sách giáo khoa, cô chia sẻ thêm với em về..." để học sinh phân biệt được nguồn kiến thức.

Luôn kết thúc bằng mục "ĐÁP ÁN" riêng biệt.

NGỮ CẢNH TÀI LIỆU (CONTEXT):
{context}
`;

/**
 * Lấy ngữ cảnh liên quan từ Kho tri thức RAG (Prisma)
 * Có lọc theo Khối lớp của học sinh
 */
export async function getRelevantContext(question: string, grade?: number): Promise<string> {
  try {
    // 1. Tìm kiếm tri thức phù hợp
    const where: any = { isActive: true };
    if (grade) {
      where.OR = [
        { tags: { has: `Khối ${grade}` } },
        { tags: { has: "Chung" } },
        { tags: { has: "Hệ thống" } }
      ];
    }

    const chunks = await prisma.knowledgeDocument.findMany({
      where,
      select: { content: true, title: true, tags: true }
    });

    const keywords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // 2. Thuật toán Scoring đơn giản (Keyword Matching)
    const scored = chunks
      .map((doc) => {
        let score = 0;
        const lowContent = doc.content.toLowerCase();
        keywords.forEach((word) => {
          if (lowContent.includes(word)) score += 2; // Match nội dung
        });
        if (doc.title.toLowerCase().includes(question.toLowerCase())) score += 5; // Match tiêu đề
        return { content: doc.content, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Lấy tối đa 8 đoạn tri thức liên quan nhất

    return scored.map((item) => item.content).join("\n\n---\n\n");
  } catch (err) {
    console.error("Context retrieval error:", err);
    return "";
  }
}

/**
 * Hỏi Gia sư AI (Chat)
 */
export async function askGiaSu(
  message: string,
  history: any[],
  context: string,
  image?: { data: string; mimeType: string }
) {
  const systemInstruction = MS_TRANG_SYSTEM_PROMPT.replace(
    "{context}",
    context || "Chưa có tài liệu được nạp phù hợp cho khối lớp này."
  );

  const model = image ? "gemini-1.5-flash-8b" : DEFAULT_GEMINI_MODEL;

  const parts: any[] = [
    { text: message || "Hãy phân tích hình ảnh này và hướng dẫn em giải bài tập." },
  ];
  if (image) {
    parts.push({
      inlineData: { data: image.data, mimeType: image.mimeType },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map((h) => ({ role: h.role, parts: h.parts })),
        { role: "user", parts },
      ],
      config: { systemInstruction, temperature: 0.6 }, // Giảm temp để bám sát tri thức hơn
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "Hệ thống AI đang bận hoặc gặp sự cố kết nối. Em vui lòng thử lại sau nhé!";
  }
}

/**
 * Tạo bộ câu hỏi Quiz (Thách đấu/Ôn tập)
 */
export async function generateQuiz(
  topic: string,
  context: string,
  grade?: string,
  type?: string,
  count?: number
) {
  const prompt = `Bạn là chuyên gia soạn đề KHTN. Tạo bộ đề Challenge dựa trên:
    - Khối: ${grade}
    - Chủ đề: ${topic}
    - Ngữ cảnh RAG: ${context}
    - Số lượng: ${count || 5} câu

    YÊU CẦU:
    - Trả về JSON mảng quizzes.
    - Dùng LaTeX $...$ cho công thức.
    - Bám sát 100% ngữ cảnh được cung cấp.

    Định dạng JSON:
    {
      "quizzes": [
        {
          "question": "...",
          "options": ["A.", "B.", "C.", "D."], 
          "answerIndex": 0,
          "correctAnswer": "...",
          "hint": "...",
          "difficulty": "Biết",
          "explanation": "...",
          "isEssay": false
        }
      ]
    }
`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return safeJSONParse(response.text || "{}");
  } catch (error: any) {
    console.error("Gemini Quiz Error:", error);
    return { error: "Không thể tạo đề lúc này." };
  }
}

/**
 * Tạo bộ Flashcards
 */
export async function generateFlashcards(topic: string, context: string, grade: string) {
  const prompt = `Tạo 5-8 thẻ Flashcards cho chủ đề ${topic}, khối ${grade}.
    Sử dụng ngữ cảnh: ${context}.
    Trả về JSON: { "flashcards": [{ "front": "...", "back": "..." }] }.
    Dùng LaTeX $...$ cho công thức.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return safeJSONParse(response.text || "{}");
}

/**
 * Tạo Mindmap
 */
export async function generateMindmap(topic: string, context: string, grade: string) {
  const prompt = `Phân tích ngữ cảnh và tạo Mindmap JSON cho chủ đề ${topic}, khối ${grade}.
    Dữ liệu: ${context}.
    Định dạng JSON: { "mindmap": [{ "id": "root", "label": "...", "parentId": null }, ...] }.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return safeJSONParse(response.text || "{}");
}

/**
 * Phân tích kết quả học tập
 */
export async function analyzePerformance(topic: string, results: any[], context: string) {
  const prompt = `Phân tích kết quả làm bài của học sinh. 
    Chủ đề: ${topic}. 
    Ngữ cảnh: ${context}.
    Dữ liệu: ${JSON.stringify(results)}.
    Trả về JSON: { "score": 10, "analysis": "...", "advice": "..." }.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return safeJSONParse(response.text || "{}");
}

/**
 * Chấm bài tự luận
 */
export async function evaluateEssay(question: string, answer: string, image?: { data: string; mimeType: string }) {
  const prompt = `Bạn là giáo viên chấm bài tự luận.
  Câu hỏi: "${question}"
  Bài làm: "${answer}"
  Trả về JSON: { "isPassing": true, "feedback": "...", "score": 8 }.`;

  const model = image ? "gemini-1.5-flash-8b" : DEFAULT_GEMINI_MODEL;
  const response = await ai.models.generateContent({
    model,
    contents: [{ text: prompt + (image ? " (Kèm ảnh bài làm)" : "") }],
    config: { responseMimeType: "application/json" },
  });
  return safeJSONParse(response.text || "{}");
}

/**
 * Sinh danh sách người dùng giả lập
 */
export async function generateMockUsers(count: number, classId?: string, grade?: number) {
  const prompt = `Tạo danh sách ${count} học sinh lớp ${grade || "6-9"} Việt Nam.
  JSON format: [{"username": "...", "displayName": "...", "studentCode": "...", "grade": ${grade || 6}}].`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  
  const result = safeJSONParse(response.text || "[]");
  const users = Array.isArray(result) ? result : [];
  return users.map((u: any) => ({ ...u, password: "123456" }));
}
