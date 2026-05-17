import { prisma } from "../config/prisma.js";
import { ChatRole, XpAction } from "@prisma/client";
import { askGemini, GeminiMessage, checkContentGuard } from "./ai.service.js";
import { retrieveRelevantContext } from "./knowledge.service.js";
import { addXp, updateChallengeProgress } from "./gamification.service.js";
import { getSystemConfig, recordSystemActivity } from "./system.service.js";

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
 * Nhận câu hỏi từ User, xử lý RAG (Lọc theo khối lớp), gọi Gemini, và lưu lịch sử
 */
export async function processUserMessage(
  userId: string,
  sessionId: string,
  content: string,
  image?: { data: string; mimeType: string }
) {
  // 1. Kiểm tra session & Lấy thông tin khối lớp của học sinh
  const [session, studentProfile] = await Promise.all([
    prisma.chatSession.findUnique({ where: { id: sessionId }, include: { user: true } }),
    prisma.studentProfile.findUnique({ where: { userId } })
  ]);

  if (!session || session.userId !== userId) {
    throw new Error("Phiên trò chuyện không hợp lệ.");
  }

  const user = session.user;
  const studentGrade = studentProfile?.grade;

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

  // 2.5. KIỂM DUYỆT NỘI DUNG (GUARD)
  const guardResult = await checkContentGuard(content);
  if (guardResult.violated) {
    // Tính toán penalty lũy tiến
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const violationCount = await prisma.activityLog.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        action: { contains: "Vi phạm: Nội dung không phù hợp" }
      }
    });

    const basePenaltyStr = await getSystemConfig("AI_GUARD_XP_PENALTY_BASE");
    const basePenalty = basePenaltyStr ? parseInt(basePenaltyStr) : 20;
    // Penalty nhân đôi: base * 2^violationCount (Lần đầu count=0 -> base)
    const penalty = basePenalty * Math.pow(2, Math.min(violationCount, 4)); // Capped ở 2^4 = 16 lần

    // Trừ XP
    await addXp(userId, -penalty, XpAction.CHAT_AI);

    // Ghi nhận vào Activity Log hệ thống
    await recordSystemActivity({
      userId,
      username: user.username,
      role: user.role,
      module: "chat",
      action: `Vi phạm: Nội dung không phù hợp (Lần ${violationCount + 1} trong tháng)`,
      source: "student",
      method: "POST",
      path: `/api/chat/sessions/${sessionId}/messages`,
      statusCode: 403,
      requestBody: { content, reason: guardResult.reason, penalty }
    });

    // Trả về thông báo cảnh báo cho học sinh
    const blockMessage = await getSystemConfig("AI_GUARD_BLOCK_MESSAGE") || 
      "Tin nhắn của em chứa nội dung không phù hợp và đã bị chặn. Em bị trừ XP và hành vi này đã được ghi nhận.";

    const aiWarningMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: ChatRole.MODEL,
        content: `⚠️ **CẢNH BÁO VI PHẠM**\n\n${blockMessage}\n\n*Lý do: ${guardResult.reason}*\n*Hình phạt: -${penalty} XP*`,
      },
    });

    return {
      userMessage,
      aiMessage: aiWarningMessage,
      addedXp: -penalty,
      violated: true
    };
  }

  // 3. Cộng 10 EXP cho User & Cập nhật thử thách
  try {
    await addXp(userId, 10, XpAction.CHAT_AI);
    await updateChallengeProgress(userId, "S_GIA_CAU_HOI", 1);
  } catch (error) {
    console.error("Lỗi cộng EXP:", error);
  }

  // 4. Kéo lịch sử chat gần nhất
  const recentMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const formattedHistory: GeminiMessage[] = recentMessages
    .reverse()
    .filter((m) => m.role !== ChatRole.SYSTEM)
    .map((m) => {
      const parts: any[] = [{ text: m.content }];
      if (m.attachments && Array.isArray(m.attachments)) {
        (m.attachments as any[]).forEach((att) => {
          if (att.type === "image" && att.data) {
            parts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
          }
        });
      }
      return {
        role: m.role === ChatRole.USER ? "user" : "model",
        parts,
      };
    });

  formattedHistory.pop();

  // 5. RAG: Tìm kiếm tri thức liên quan (Ưu tiên theo KHỐI LỚP)
  const context = await retrieveRelevantContext(content, 5, studentGrade);

  // 6. Gọi Gemini API
  const aiResponseText = await askGemini(content, formattedHistory, context, image);

  // 7. Lưu tin nhắn phản hồi của AI
  const aiMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: ChatRole.MODEL,
      content: aiResponseText,
    },
  });

  // Cập nhật thời gian cho Session
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
