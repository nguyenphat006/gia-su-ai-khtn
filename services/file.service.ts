import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";

/**
 * Trích xuất văn bản từ buffer dựa trên MIME type.
 * Hỗ trợ: PDF, DOCX, và các file text thuần.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const data = await pdf(buffer);
    return data.text.trim();
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimeType.startsWith("text/")) {
    return buffer.toString("utf-8").trim();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
