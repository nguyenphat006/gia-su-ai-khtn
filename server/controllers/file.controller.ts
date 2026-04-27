import { Request, Response } from "express";
import { extractTextFromBuffer } from "../services/file.service.js";
import { asyncHandler } from "../middleware/error-handler.js";

/**
 * POST /api/files/extract
 * Trích xuất văn bản từ file PDF/Word/Text
 */
export const extractText = asyncHandler(
  async (req: Request, res: Response) => {
    const { fileData, fileName, mimeType } = req.body;

    if (!fileData) {
      return res.status(400).json({ status: "error", message: "Không có dữ liệu file." });
    }

    // Chuyển base64 thành Buffer
    const buffer = Buffer.from(fileData.split(",")[1], "base64");

    const text = await extractTextFromBuffer(buffer, mimeType);
    res.json({ status: "ok", data: { text, fileName } });
  }
);
