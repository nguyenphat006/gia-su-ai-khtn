import { prisma } from "../config/prisma.js";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Xử lý chính: Nhận file, lưu DB, và bắt đầu chạy nền.
 */
export async function processDocumentUpload(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
  grade?: number,
  topic?: string
) {
  const isPdf = mimetype === "application/pdf" || originalname.endsWith(".pdf");
  const isDocx = mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || originalname.endsWith(".docx");
  const isTxt = mimetype === "text/plain" || originalname.endsWith(".txt");

  if (!isPdf && !isDocx && !isTxt) {
    throw new Error("Định dạng tệp không được hỗ trợ. Chỉ hỗ trợ PDF, DOCX, TXT.");
  }

  // === BƯỚC 1: Trích xuất text ===
  let extractedText = "";

  if (isPdf) {
    // PDF: Upload lên Gemini File API 1 lần → trích text 1 lần
    console.log(`[Document] Bắt đầu trích xuất PDF: ${originalname} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
    extractedText = await extractTextFromPdfViaGemini(buffer, originalname);
  } else if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else {
    extractedText = buffer.toString("utf8");
  }

  if (!extractedText || extractedText.replace(/\s/g, "").length < 50) {
    throw new Error("Không trích xuất được văn bản từ tệp. Vui lòng thử lại với file khác.");
  }

  console.log(`[Document] Trích xuất thành công: ${extractedText.length} ký tự`);

  // === BƯỚC 2: Chunk text ===
  const chunks = chunkText(extractedText, 4000);
  console.log(`[Document] Chia thành ${chunks.length} đoạn văn bản`);

  // === BƯỚC 3: Tạo record DB ===
  const document = await prisma.sourceDocument.create({
    data: {
      filename: originalname,
      grade,
      topic,
      totalChunks: chunks.length,
      status: "PROCESSING",
    },
  });

  // === BƯỚC 4: Background Job sinh câu hỏi từ TEXT (rẻ, không gửi PDF nữa) ===
  runQuizGenerationJob(document.id, chunks, grade, topic).catch(console.error);

  return document;
}

/**
 * Upload PDF lên Gemini File API → Gọi 1 lần duy nhất để trích xuất toàn bộ text
 * Chi phí: 1 file upload (miễn phí) + 1 lần generate (tiết kiệm hơn 56 lần rất nhiều)
 */
async function extractTextFromPdfViaGemini(buffer: Buffer, originalname: string): Promise<string> {
  // Ghi tạm ra file vì Gemini File API cần đường dẫn file
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${originalname}`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    // 1. Upload file lên Gemini (miễn phí, không tốn token)
    console.log(`[PDF Extract] Uploading to Gemini File API...`);
    const uploadedFile = await ai.files.upload({
      file: tmpPath,
      config: { mimeType: "application/pdf" },
    });

    console.log(`[PDF Extract] Upload OK: ${uploadedFile.name}, state: ${uploadedFile.state}`);

    // 2. Chờ file sẵn sàng (nếu đang processing)
    let fileRef = uploadedFile;
    while (fileRef.state === "PROCESSING") {
      console.log(`[PDF Extract] File đang được xử lý, chờ 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
      const updated = await ai.files.get({ name: fileRef.name! });
      fileRef = updated;
    }

    if (fileRef.state === "FAILED") {
      throw new Error("Gemini không thể xử lý file PDF này.");
    }

    // 3. Gọi Gemini 1 LẦN DUY NHẤT để trích xuất text (có retry nếu bị rate limit)
    console.log(`[PDF Extract] Đang trích xuất toàn bộ văn bản...`);
    let text = "";
    for (let retry = 0; retry < 5; retry++) {
      try {
        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                {
                  fileData: {
                    fileUri: fileRef.uri!,
                    mimeType: "application/pdf",
                  },
                },
                {
                  text: `Hãy trích xuất TOÀN BỘ nội dung văn bản trong file PDF này. 
Yêu cầu:
- Trích nguyên văn bản gốc, KHÔNG tóm tắt, KHÔNG bỏ sót nội dung
- Giữ nguyên cấu trúc: tiêu đề chương, bài, mục, nội dung chi tiết
- Bỏ qua header/footer lặp lại, số trang
- Giữ lại các công thức, bảng biểu dưới dạng text
- Trả về text thuần (plain text), mỗi phần cách nhau bằng 2 dòng trống`,
                },
              ],
            },
          ],
        });
        text = result.text || "";
        break;
      } catch (err: any) {
        if (err.status === 429 || err.status === 503) {
          const waitSec = Math.min(120, 15 * (retry + 1));
          console.warn(`[PDF Extract] Rate limited, chờ ${waitSec}s rồi thử lại (${retry + 1}/5)...`);
          await new Promise((r) => setTimeout(r, waitSec * 1000));
        } else {
          throw err;
        }
      }
    }
    console.log(`[PDF Extract] Trích xuất xong: ${text.length} ký tự`);

    // 4. Xóa file tạm trên Gemini để giải phóng quota storage
    try {
      await ai.files.delete({ name: fileRef.name! });
    } catch (e) {
      // Không quan trọng nếu xóa thất bại
    }

    return text;
  } finally {
    // Xóa file tạm local
    try { fs.unlinkSync(tmpPath); } catch (e) { /* ignore */ }
  }
}

/**
 * Background Job: Sinh câu hỏi từ TEXT chunks (nhẹ, không gửi PDF)
 */
async function runQuizGenerationJob(documentId: string, chunks: string[], grade?: number, topic?: string) {
  let parsedCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Bỏ qua chunk quá ngắn
    if (chunk.replace(/\s/g, "").length < 100) {
      parsedCount++;
      await prisma.sourceDocument.update({
        where: { id: documentId },
        data: { parsedChunks: parsedCount },
      });
      continue;
    }

    try {
      const prompt = `
Bạn là một chuyên gia giáo dục Việt Nam. Dựa vào nội dung tài liệu sau, hãy tạo 3 câu trắc nghiệm và 1 câu tự luận.

NỘI DUNG:
---
${chunk}
---

Trả về mảng JSON:
[
  {
    "type": "MULTIPLE_CHOICE",
    "difficulty": "Thông hiểu",
    "content": "Câu hỏi...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "A. ...",
    "explanation": "Giải thích..."
  }
]`;

      let resultText = "";
      for (let retry = 0; retry < 3; retry++) {
        try {
          const result = await ai.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });
          resultText = result.text || "";
          break;
        } catch (err: any) {
          const waitTime = Math.min(30000, 5000 * (retry + 1));
          console.warn(`[Quiz Job] Chunk ${i + 1} retry ${retry + 1}, chờ ${waitTime / 1000}s...`);
          await new Promise((r) => setTimeout(r, waitTime));
        }
      }

      if (!resultText) {
        console.warn(`[Quiz Job] Chunk ${i + 1} không có kết quả, bỏ qua`);
        parsedCount++;
        continue;
      }

      const jsonStr = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      const generatedQuestions = JSON.parse(jsonStr);

      // 1. Tạo câu hỏi ôn tập (Revision source)
      for (const q of generatedQuestions) {
        await prisma.questionBank.create({
          data: {
            grade,
            topic: topic || "Chưa xác định",
            type: q.type || "MULTIPLE_CHOICE",
            difficulty: q.difficulty || "Thông hiểu",
            content: q.content,
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation || "",
            status: "PENDING",
            sourceDocumentId: documentId,
            isActive: false,
          },
        });
      }

      // 2. Tạo tri thức RAG (Knowledge source) - Tự động nạp vào bộ não AI
      await prisma.knowledgeDocument.create({
        data: {
          title: `[Tài liệu] ${topic || "Chưa rõ"} - Phần ${i + 1}`,
          content: chunk,
          tags: [topic || "Tài liệu hệ thống", `Khối ${grade || "Chung"}`],
          isActive: true,
        }
      });

      parsedCount++;
      console.log(`[Quiz Job] Chunk ${i + 1}/${chunks.length} ✓ — ${generatedQuestions.length} câu hỏi`);
    } catch (error: any) {
      console.error(`[Quiz Job] Chunk ${i + 1}/${chunks.length} FAILED:`, error.message);
      parsedCount++;
    }

    // Cập nhật tiến độ
    await prisma.sourceDocument.update({
      where: { id: documentId },
      data: { parsedChunks: parsedCount },
    });

    // Nghỉ giữa các chunk — tôn trọng rate limit free tier
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  await prisma.sourceDocument.update({
    where: { id: documentId },
    data: { status: "COMPLETED", parsedChunks: parsedCount },
  });
  console.log(`[Quiz Job] ✅ Hoàn tất tài liệu ${documentId}: ${parsedCount} chunks đã xử lý`);
}

/**
 * Chia nhỏ văn bản theo đoạn
 */
function chunkText(text: string, maxChunkLength = 4000): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

/**
 * Lấy danh sách các tài liệu đã tải lên
 */
export async function getSourceDocuments() {
  return await prisma.sourceDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });
}

/**
 * Duyệt / Xóa các câu hỏi Pending
 */
export async function reviewPendingQuestions(documentId: string, action: "APPROVE_ALL" | "DELETE_ALL") {
  if (action === "APPROVE_ALL") {
    await prisma.questionBank.updateMany({
      where: { sourceDocumentId: documentId, status: "PENDING" },
      data: { status: "APPROVED", isActive: true },
    });
  } else if (action === "DELETE_ALL") {
    await prisma.questionBank.deleteMany({
      where: { sourceDocumentId: documentId, status: "PENDING" },
    });
  }
}
