import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/prisma.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { retrieveRelevantContext } from "./knowledge.service.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ========================
// TYPES
// ========================

interface ArenaQuizConfig {
  classId?: string;
  grade?: string;
  topic: string;
  type?: string;       // "Trắc nghiệm" | "Tự luận" | "Trắc nghiệm & Tự luận"
  difficulty?: string[];  // ["Nhận biết", "Thông hiểu", "Vận dụng"]
  count?: number;       // Tối đa 20
}

interface SaveArenaResultDto {
  userId: string;
  score: number;
  mode: "PVP" | "AI";
  winner: boolean;
  opponent: string;
  topic?: string;
}

// ========================
// AI QUIZ GENERATION
// ========================

function safeJSONParse(text: string) {
  try {
    const sanitized = text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    return JSON.parse(sanitized);
  } catch (error) {
    console.error("JSON parse error:", error);
    return {};
  }
}

/**
 * Gọi Gemini AI hoặc lấy từ QuestionBank để tạo bộ câu hỏi thách đấu
 */
export async function generateArenaQuiz(config: ArenaQuizConfig) {
  const count = Math.min(20, Math.max(1, config.count || 10));
  const type = config.type || "Trắc nghiệm";
  const difficulty = config.difficulty || ["Nhận biết", "Thông hiểu", "Vận dụng"];
  const gradeNum = config.grade ? Number(config.grade) : null;

  // 1. THỬ LẤY TỪ NGÂN HÀNG CÂU HỎI (QuestionBank) TRƯỚC
  let quizzes: any[] = [];
  
  try {
    const whereClause: any = {
      isActive: true,
    };
    
    // Nếu là chủ đề ôn tập chung -> Chỉ lọc theo khối
    if (config.topic.includes("Ôn tập KHTN")) {
        if (gradeNum) whereClause.grade = gradeNum;
    } else {
        // Nếu là chủ đề cụ thể -> Lọc theo topic + grade
        whereClause.topic = { contains: config.topic, mode: "insensitive" };
        if (gradeNum) whereClause.grade = gradeNum;
    }

    if (type !== "Trắc nghiệm & Tự luận") {
        whereClause.type = type === "Trắc nghiệm" ? "MULTIPLE_CHOICE" : "ESSAY";
    }

    // Lấy ngẫu nhiên bằng cách dùng skip với một số ngẫu nhiên nếu Bank có nhiều câu
    const totalInBank = await prisma.questionBank.count({ where: whereClause });
    const skip = totalInBank > count ? Math.floor(Math.random() * (totalInBank - count)) : 0;

    const bankQuestions = await prisma.questionBank.findMany({
      where: whereClause,
      take: count,
      skip: skip
    });

    // Map bank questions to Arena format
    quizzes = bankQuestions.map(q => {
      const options = q.options as string[] | null;
      let answerIndex = -1;
      if (options && q.correctAnswer) {
        answerIndex = options.indexOf(q.correctAnswer);
      }

      return {
        id: q.id,
        question: q.content,
        options: options || [],
        answerIndex: answerIndex,
        correctAnswer: q.correctAnswer,
        hint: q.hint,
        difficulty: q.difficulty,
        explanation: q.explanation,
        isEssay: q.type === "ESSAY"
      };
    });
  } catch (err) {
    console.error("Error fetching from QuestionBank:", err);
  }

  // 2. NẾU THIẾU CÂU HỎI -> GỌI AI BỔ SUNG
  if (quizzes.length < count) {
    const remainingCount = count - quizzes.length;
    const context = await retrieveRelevantContext(config.topic);

    const prompt = `Bạn là hệ thống "Đấu Trường Trí Tuệ AI" thuộc dự án Gia sư AI KHTN.
      Nhiệm vụ: Khởi tạo bộ câu hỏi thách đấu dựa trên thông tin sau:
      - Khối: ${config.grade || "Chưa xác định"}
      - Bài học/Chủ đề: ${config.topic}
      - Dạng bài tập: ${type}
      - Mức độ: ${difficulty.join(", ")}
      - Số lượng câu hỏi: ${remainingCount} câu

      QUY TẮC:
      - Chỉ lấy kiến thức từ sách giáo khoa "Chân trời sáng tạo" KHTN THCS.
      - Trình bày công thức bằng $...$ (LaTeX).
      ${context ? `Dựa trên ngữ cảnh: ${context}` : ""}

      Trả lời DUY NHẤT định dạng JSON:
      {
        "quizzes": [
          {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "answerIndex": number,
            "correctAnswer": "string (nội dung đáp án đúng)",
            "hint": "string",
            "difficulty": "Biết" | "Hiểu" | "Vận dụng",
            "explanation": "string",
            "isEssay": boolean
          }
        ]
      }`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      const aiResult = safeJSONParse(response.text || "{}");
      
      if (aiResult.quizzes && Array.isArray(aiResult.quizzes)) {
        // Lưu câu hỏi mới vào Bank để lần sau dùng (Async - không đợi)
        saveAiQuestionsToBank(aiResult.quizzes, config.topic, gradeNum);
        
        quizzes = [...quizzes, ...aiResult.quizzes];
      } else if (aiResult.error && quizzes.length === 0) {
        return { error: aiResult.error };
      }
    } catch (error: any) {
      console.error("Gemini Arena Quiz Error:", error);
      if (quizzes.length === 0) {
        return { error: "Không thể kết nối với AI để tạo câu hỏi." };
      }
    }
  }

  return { quizzes: quizzes.slice(0, count) };
}

/**
 * Lưu các câu hỏi AI tạo ra vào ngân hàng (Background)
 */
async function saveAiQuestionsToBank(quizzes: any[], topic: string, grade: number | null) {
    for (const q of quizzes) {
        try {
            await prisma.questionBank.create({
                data: {
                    grade,
                    topic,
                    type: q.isEssay ? "ESSAY" : "MULTIPLE_CHOICE",
                    difficulty: q.difficulty || "Thông hiểu",
                    content: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer || (q.options ? q.options[q.answerIndex] : ""),
                    explanation: q.explanation,
                    hint: q.hint,
                    isActive: true
                }
            });
        } catch (e) {
            // Ignore duplicate or save errors
        }
    }
}

// ========================
// SAVE RESULT + XP
// ========================

/**
 * Lưu kết quả trận đấu + cộng XP
 */
export async function saveArenaResult(data: SaveArenaResultDto) {
  // Tính XP
  let xpEarned = data.mode === "AI" ? 50 : 20;
  if (data.winner) xpEarned += data.mode === "AI" ? 50 : 30;

  // Lưu ArenaResult
  const result = await prisma.arenaResult.create({
    data: {
      userId: data.userId,
      score: data.score,
      mode: data.mode,
      winner: data.winner,
      opponent: data.opponent,
      topic: data.topic,
      xpEarned,
    },
  });

  // Cộng XP vào UserStats
  await prisma.userStats.upsert({
    where: { userId: data.userId },
    update: { totalXp: { increment: xpEarned } },
    create: { userId: data.userId, totalXp: xpEarned },
  });

  // Ghi XpLog
  await prisma.xpLog.create({
    data: {
      userId: data.userId,
      amount: xpEarned,
      action: "WIN_ARENA",
      referenceId: result.id,
    },
  });

  return { ...result, xpEarned };
}

// ========================
// LEADERBOARD
// ========================

/**
 * Lấy bảng xếp hạng top N (aggregate tổng điểm cao nhất)
 */
export async function getLeaderboard(limit = 10) {
  const results = await prisma.arenaResult.groupBy({
    by: ["userId"],
    _sum: { score: true },
    _count: { id: true },
    orderBy: { _sum: { score: "desc" } },
    take: limit,
  });

  // Lấy thông tin user cho từng entry
  const userIds = results.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, username: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Đếm số trận thắng
  const winCounts = await prisma.arenaResult.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, winner: true },
    _count: { id: true },
  });
  const winMap = new Map(winCounts.map((w) => [w.userId, w._count.id]));

  return results.map((r, idx) => {
    const user = userMap.get(r.userId);
    return {
      rank: idx + 1,
      userId: r.userId,
      displayName: user?.displayName || "Unknown",
      username: user?.username || "unknown",
      totalScore: r._sum.score || 0,
      totalMatches: r._count.id,
      wins: winMap.get(r.userId) || 0,
      winRate: r._count.id > 0
        ? Math.round(((winMap.get(r.userId) || 0) / r._count.id) * 100)
        : 0,
    };
  });
}

// ========================
// USER STATS
// ========================

/**
 * Lấy thống kê cá nhân của user trong arena
 */
export async function getUserArenaStats(userId: string) {
  const [total, wins] = await Promise.all([
    prisma.arenaResult.count({ where: { userId } }),
    prisma.arenaResult.count({ where: { userId, winner: true } }),
  ]);

  const totalScore = await prisma.arenaResult.aggregate({
    where: { userId },
    _sum: { score: true },
  });

  return {
    totalMatches: total,
    wins,
    losses: total - wins,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    totalScore: totalScore._sum.score || 0,
  };
}

/**
 * Phân tích hiệu suất của học sinh sau trận đấu AI
 */
export async function analyzeArenaPerformance(params: {
  topic: string;
  results: any[];
}) {
  const { topic, results } = params;

  // Lấy ngữ cảnh từ Knowledge Base
  const context = await retrieveRelevantContext(topic);

  const prompt = `Bạn là cô Trang, giáo viên KHTN. Hãy phân tích kết quả làm bài của học sinh trong trận đấu trí chủ đề: ${topic}.
    
    Dữ liệu bài làm:
    ${JSON.stringify(results)}
    
    Ngữ cảnh tài liệu:
    ${context || "Kiến thức KHTN chuẩn sách giáo khoa."}

    YÊU CẦU:
    1. Chấm điểm theo thang điểm 10.
    2. Phân tích lỗ hổng: Chỉ ra chính xác học sinh đang yếu ở phần kiến thức nào.
    3. Lời khuyên từ cô Trang: Gợi ý các phần kiến thức cụ thể học sinh nên ôn tập lại.
    4. Giọng văn: Thân thiện, khích lệ, sư phạm.
    5. Sử dụng LaTeX ($...$) cho MỌI công thức và ký hiệu khoa học.

    Trả lời duy nhất định dạng JSON:
    {
      "score": number,
      "analysis": "string",
      "advice": "string"
    }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return safeJSONParse(response.text || "{}");
  } catch (error: any) {
    console.error("Gemini Arena Analysis Error:", error);
    return { 
      error: "Không thể thực hiện phân tích lúc này.",
      analysis: "Chúc mừng em đã hoàn thành trận đấu! Hãy tiếp tục phát huy nhé.",
      advice: "Em hãy xem lại các câu mình đã làm sai để củng cố kiến thức."
    };
  }
}
