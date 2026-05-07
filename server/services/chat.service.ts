import { prisma } from "../config/prisma.js";
import { ChatRole, XpAction } from "@prisma/client";
import { askGemini, GeminiMessage } from "./ai.service.js";
import { retrieveRelevantContext } from "./knowledge.service.js";
import { addXp, updateChallengeProgress } from "./gamification.service.js";

/**
 * Lấy danh sách các phiên chat của một user
 */
export async function getUserSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });
}

/**
 * Lấy lịch sử tin nhắn của một phiên
 */
export async function getSessionMessages(sessionId: string, userId: string) {
  // Đảm bảo session thuộc về user này
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Không tìm thấy phiên trò chuyện hoặc bạn không có quyền truy cập.");
  }

  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Tạo phiên chat mới
 */
export async function createSession(userId: string, title = "Đoạn chat mới") {
  return prisma.chatSession.create({
    data: {
      userId,
      title,
    },
  });
}

/**
 * Nhận câu hỏi từ User, xử lý RAG, gọi Gemini, và lưu lịch sử
 */
export async function processUserMessage(
  userId: string,
  sessionId: string,
  content: string,
  image?: { data: string; mimeType: string }
) {
  // 1. Kiểm tra session
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Phiên trò chuyện không hợp lệ.");
  }

  // 2. Lưu tin nhắn của User vào DB
  const userMessageData: any = {
    sessionId,
    role: ChatRole.USER,
    content,
  };
  
  if (image) {
    userMessageData.attachments = [{ type: "image", mimeType: image.mimeType, data: image.data }];
  }

  const userMessage = await prisma.chatMessage.create({
    data: userMessageData,
  });

  // 3. Cộng 10 EXP cho User vì đã đặt câu hỏi & Cập nhật thử thách
  try {
    await addXp(userId, 10, XpAction.CHAT_AI);
    await updateChallengeProgress(userId, "S_GIA_CAU_HOI", 1);
  } catch (error) {
    console.error("Lỗi khi cộng EXP cho user:", error);
  }

  // 4. Kéo lịch sử chat gần nhất (10 tin nhắn) để truyền cho AI
  const recentMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Đảo ngược lại thành thứ tự thời gian cũ -> mới
  const formattedHistory: GeminiMessage[] = recentMessages
    .reverse()
    .filter((m) => m.role !== ChatRole.SYSTEM) // Bỏ qua system msg nếu có
    .map((m) => {
      const parts: any[] = [{ text: m.content }];
      
      // Thêm attachments nếu có
      if (m.attachments && Array.isArray(m.attachments)) {
        (m.attachments as any[]).forEach((att) => {
          if (att.type === "image" && att.data) {
            parts.push({
              inlineData: {
                data: att.data,
                mimeType: att.mimeType,
              },
            });
          }
        });
      }

      return {
        role: m.role === ChatRole.USER ? "user" : "model",
        parts,
      };
    });

  // Loại bỏ câu hỏi hiện tại vừa thêm khỏi history vì askGemini đã tự nạp câu hỏi mới
  formattedHistory.pop();

  // 5. RAG: Tìm kiếm tài liệu liên quan từ DB (Knowledge Base)
  const context = await retrieveRelevantContext(content);

  // 6. Gọi Gemini API
  const aiResponseText = await askGemini(content, formattedHistory, context, image);

  // 7. Lưu tin nhắn phản hồi của AI vào DB
  const aiMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: ChatRole.MODEL,
      content: aiResponseText,
    },
  });

  // Cập nhật updatedAt cho Session
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return {
    userMessage,
    aiMessage,
    addedXp: 10,
  };
}
