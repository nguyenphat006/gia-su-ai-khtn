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
 * Xử lý chính: Nhận file, trích xuất text, lưu DB, và nạp vào RAG + sinh câu hỏi tự động
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
    console.log(`[Document] Bắt đầu trích xuất PDF: ${originalname}`);
    extractedText = await extractTextFromPdfViaGemini(buffer, originalname);
  } else if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else {
    extractedText = buffer.toString("utf8");
  }

  if (!extractedText || extractedText.replace(/\s/g, "").length < 50) {
    throw new Error("Không trích xuất được văn bản từ tệp.");
  }

  // === BƯỚC 2: Chunk text ===
  const chunks = chunkText(extractedText, 3000);

  // === BƯỚC 3: Tạo record DB ===
  const document = await prisma.sourceDocument.create({
    data: {
      filename: originalname,
      grade,
      topic,
      totalChunks: chunks.length,
      rawText: extractedText,
      status: "PROCESSING",
    },
  });

  // === BƯỚC 4: Background Job nạp tri thức và sinh câu hỏi (APPROVED luôn) ===
  runKnowledgeIngestionJob(document.id, chunks, grade, topic).catch(console.error);

  return document;
}

/**
 * Background Job: Chia nhỏ văn bản, nạp RAG và sinh câu hỏi Ôn tập tự động
 */
async function runKnowledgeIngestionJob(documentId: string, chunks: string[], grade?: number, topic?: string) {
  let parsedCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.replace(/\s/g, "").length < 100) {
      parsedCount++;
      continue;
    }

    try {
      // 1. Nạp trực tiếp vào Kho tri thức RAG
      await prisma.knowledgeDocument.create({
        data: {
          title: `[Tài liệu] ${topic || "Hệ thống"} - P${i + 1}`,
          content: chunk,
          tags: [topic || "Tri thức nạp", `Khối ${grade || "Chung"}`, "Hệ thống"],
          isActive: true,
        }
      });

      // 2. Sinh câu hỏi tự động (APPROVED luôn, ko cần duyệt)
      const prompt = `Bạn là chuyên gia giáo dục. Tạo 2 câu trắc nghiệm và 1 câu tự luận từ nội dung sau.
      NỘI DUNG: ${chunk}
      Trả về JSON: [{"type": "MULTIPLE_CHOICE", "difficulty": "Thông hiểu", "content": "...", "options": ["A.", "B.", "C.", "D."], "correctAnswer": "A.", "explanation": "..."}]`;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      
      const generated = JSON.parse(result.text || "[]");
      for (const q of (Array.isArray(generated) ? generated : [])) {
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
            status: "APPROVED", // Import thẳng luôn
            sourceDocumentId: documentId,
            isActive: true,
          },
        });
      }

      parsedCount++;
    } catch (error: any) {
      console.error(`[Ingestion Job] Chunk ${i + 1} FAILED:`, error.message);
      parsedCount++;
    }

    await prisma.sourceDocument.update({
      where: { id: documentId },
      data: { parsedChunks: parsedCount },
    });

    await new Promise((r) => setTimeout(r, 2000)); // Rate limit protection
  }

  await prisma.sourceDocument.update({
    where: { id: documentId },
    data: { status: "COMPLETED", parsedChunks: parsedCount },
  });
}

async function extractTextFromPdfViaGemini(buffer: Buffer, originalname: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${originalname}`);
  fs.writeFileSync(tmpPath, buffer);
  try {
    const uploadedFile = await ai.files.upload({
      file: tmpPath,
      config: { mimeType: "application/pdf" },
    });
    let fileRef = uploadedFile;
    while (fileRef.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 2000));
      const updated = await ai.files.get({ name: fileRef.name! });
      fileRef = updated;
    }
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ fileData: { fileUri: fileRef.uri!, mimeType: "application/pdf" } }, { text: "Trích xuất toàn bộ văn bản." }],
    });
    return result.text || "";
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (e) {}
  }
}

function chunkText(text: string, maxChunkLength = 3000): string[] {
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
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
}

export async function getSourceDocuments(params: { page: number; limit: number; search?: string; grade?: number }) {
  const { page, limit, search, grade } = params;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (search) {
    where.OR = [{ filename: { contains: search, mode: "insensitive" } }, { topic: { contains: search, mode: "insensitive" } }];
  }
  if (grade) where.grade = grade;
  const [documents, total] = await Promise.all([
    prisma.sourceDocument.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, include: { _count: { select: { questions: true } } } }),
    prisma.sourceDocument.count({ where }),
  ]);
  return { documents, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getDocumentContent(id: string) {
  return await prisma.sourceDocument.findUnique({ where: { id }, select: { id: true, filename: true, rawText: true, topic: true, grade: true } });
}

export async function reviewPendingQuestions(documentId: string, action: "APPROVE_ALL" | "DELETE_ALL") {
  if (action === "APPROVE_ALL") {
    await prisma.questionBank.updateMany({ where: { sourceDocumentId: documentId, status: "PENDING" }, data: { status: "APPROVED", isActive: true } });
  } else if (action === "DELETE_ALL") {
    await prisma.questionBank.deleteMany({ where: { sourceDocumentId: documentId, status: "PENDING" } });
  }
}
