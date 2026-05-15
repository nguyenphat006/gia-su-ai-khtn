import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { getSystemConfig } from "./system.service.js";

// ==========================================
// 1. GET CHAT LOGS
// ==========================================
export async function getChatLogs(page = 1, limit = 50, keyword?: string, userId?: string) {
  const skip = (page - 1) * limit;
  const searchKeyword = keyword ? `%${keyword}%` : '';
  const targetUserId = userId ? userId : '';

  const countQuery = Prisma.sql`
    WITH RankedMessages AS (
      SELECT 
        id, 
        "sessionId", 
        role::text as role_text, 
        content, 
        "createdAt",
        LEAD(role::text) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_role_text,
        LEAD(content) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_content
      FROM "ChatMessage"
    ),
    Pairs AS (
      SELECT
        "sessionId",
        content as user_content,
        next_content as model_content
      FROM RankedMessages
      WHERE role_text = 'USER' AND next_role_text = 'MODEL'
    )
    SELECT COUNT(*)::int as total
    FROM Pairs p
    JOIN "ChatSession" s ON p."sessionId" = s.id
    WHERE (${searchKeyword} = '' OR p.user_content ILIKE ${searchKeyword} OR p.model_content ILIKE ${searchKeyword})
      AND (${targetUserId} = '' OR s."userId" = ${targetUserId})
  `;

  const dataQuery = Prisma.sql`
    WITH RankedMessages AS (
      SELECT 
        id, 
        "sessionId", 
        role::text as role_text, 
        content, 
        "createdAt",
        LEAD(id) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_id,
        LEAD(role::text) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_role_text,
        LEAD(content) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_content,
        LEAD("createdAt") OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_created_at
      FROM "ChatMessage"
    ),
    Pairs AS (
      SELECT
        id as user_msg_id,
        content as user_content,
        "createdAt" as user_created_at,
        "sessionId",
        next_id as model_msg_id,
        next_content as model_content,
        next_created_at as model_created_at
      FROM RankedMessages
      WHERE role_text = 'USER' AND next_role_text = 'MODEL'
    )
    SELECT 
      p.user_msg_id as "id",
      p.user_content as "question",
      p.user_created_at as "createdAt",
      p.model_msg_id as "modelMsgId",
      p.model_content as "answer",
      p.model_created_at as "answeredAt",
      p."sessionId",
      s.title as "sessionTitle",
      u.id as "userId",
      u."displayName",
      u.username,
      sp."studentCode",
      sp.grade,
      c.name as "className"
    FROM Pairs p
    JOIN "ChatSession" s ON p."sessionId" = s.id
    JOIN "User" u ON s."userId" = u.id
    LEFT JOIN "StudentProfile" sp ON u.id = sp."userId"
    LEFT JOIN "Class" c ON u."classId" = c.id
    WHERE (${searchKeyword} = '' OR p.user_content ILIKE ${searchKeyword} OR p.model_content ILIKE ${searchKeyword})
      AND (${targetUserId} = '' OR s."userId" = ${targetUserId})
    ORDER BY p.user_created_at DESC
    LIMIT ${limit} OFFSET ${skip}
  `;

  const [countResult, pairs] = await prisma.$transaction([
    prisma.$queryRaw(countQuery),
    prisma.$queryRaw(dataQuery)
  ]);

  const total = Array.isArray(countResult) && countResult.length > 0 ? Number(countResult[0].total) : 0;

  // Format response to match object structure
  const formattedPairs = (pairs as any[]).map(p => ({
    id: p.id,
    sessionId: p.sessionId,
    question: p.question,
    answer: p.answer,
    createdAt: p.createdAt,
    answeredAt: p.answeredAt,
    session: {
      id: p.sessionId,
      title: p.sessionTitle,
      user: {
        id: p.userId,
        displayName: p.displayName,
        username: p.username,
        studentProfile: p.studentCode ? { studentCode: p.studentCode, grade: p.grade } : null,
        class: p.className ? { name: p.className } : null
      }
    }
  }));

  return {
    data: formattedPairs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

// ==========================================
// 2. GET STUDY TIME ANALYTICS (Heatmap)
// ==========================================
export async function getStudyTimeAnalytics() {
  // Sử dụng khoảng lệch +7 tiếng (interval '7 hours') để ép Postgres tính toán đúng giờ Việt Nam
  // Cách này an toàn hơn 'AT TIME ZONE' vì không phụ thuộc vào bộ nhớ múi giờ của hệ điều hành server.
  
  const rawData: any[] = await prisma.$queryRaw`
    SELECT 
      EXTRACT(DOW FROM ("createdAt" + interval '7 hours'))::int as "dayOfWeek",
      EXTRACT(HOUR FROM ("createdAt" + interval '7 hours'))::int as "hourOfDay",
      COUNT(*)::int as "actionCount"
    FROM "XpLog"
    GROUP BY 1, 2
    ORDER BY "dayOfWeek", "hourOfDay";
  `;

  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return rawData.map(row => ({
    dayOfWeek: row.dayOfWeek,
    hourOfDay: row.hourOfDay,
    actionCount: row.actionCount
  }));
}

// ==========================================
// 3. GET MONTHLY LEADERBOARD
// ==========================================
export async function getMonthlyLeaderboard(year: number, month: number) {
  // Tạo ngày bắt đầu và kết thúc của tháng (month là 1-12)
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Tính tổng EXP từ XpLog trong tháng
  const leaderboard = await prisma.xpLog.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate,
      }
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10,
  });

  // Lấy thông tin User tương ứng
  const userIds = leaderboard.map(l => l.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      displayName: true,
      username: true,
      studentProfile: { select: { avatarUrl: true, studentCode: true } }
    }
  });

  // Gắn thông tin User vào kết quả
  const result = leaderboard.map(l => {
    const user = users.find(u => u.id === l.userId);
    return {
      userId: l.userId,
      totalXp: l._sum.amount || 0,
      user,
    };
  });

  return result;
}

// ==========================================
// 4. GET ARENA LOGS (PVP + AI)
// ==========================================
export async function getArenaLogs(page = 1, limit = 50, userId?: string, mode?: string) {
  const skip = (page - 1) * limit;
  const targetUserId = userId || '';
  const targetMode = mode || ''; // 'PVP', 'AI', hoặc '' (tất cả)

  // Query ghép trận đấu:
  // - PVP: 2 records cùng topic + createdAt gần nhau → ghép thành 1 trận (player1 vs player2)
  // - AI: 1 record → 1 trận (player vs Gia sư AI)
  const countQuery = Prisma.sql`
    WITH PvpMatches AS (
      SELECT 
        LEAST(a1.id, a2.id) as match_id,
        MIN(a1."createdAt") as "createdAt"
      FROM "ArenaResult" a1
      JOIN "ArenaResult" a2 
        ON a1."userId" != a2."userId"
        AND a1.topic = a2.topic
        AND a1.mode = 'PVP' AND a2.mode = 'PVP'
        AND ABS(EXTRACT(EPOCH FROM (a1."createdAt" - a2."createdAt"))) < 10
        AND a1.id < a2.id
      WHERE (${targetUserId} = '' OR a1."userId" = ${targetUserId} OR a2."userId" = ${targetUserId})
        AND (${targetMode} = '' OR ${targetMode} = 'PVP')
      GROUP BY LEAST(a1.id, a2.id)
    ),
    AiMatches AS (
      SELECT id as match_id, "createdAt"
      FROM "ArenaResult"
      WHERE mode = 'AI'
        AND (${targetUserId} = '' OR "userId" = ${targetUserId})
        AND (${targetMode} = '' OR ${targetMode} = 'AI')
    ),
    AllMatches AS (
      SELECT match_id FROM PvpMatches
      UNION ALL
      SELECT match_id FROM AiMatches
    )
    SELECT COUNT(*)::int as total FROM AllMatches
  `;

  const dataQuery = Prisma.sql`
    WITH PvpPairs AS (
      SELECT 
        LEAST(a1.id, a2.id) as match_id,
        a1.id as p1_id, a1."userId" as p1_user_id, a1.score as p1_score, a1.winner as p1_winner, a1."xpEarned" as p1_xp,
        a2.id as p2_id, a2."userId" as p2_user_id, a2.score as p2_score, a2.winner as p2_winner, a2."xpEarned" as p2_xp,
        a1.topic,
        'PVP' as mode,
        LEAST(a1."createdAt", a2."createdAt") as "createdAt"
      FROM "ArenaResult" a1
      JOIN "ArenaResult" a2 
        ON a1."userId" != a2."userId"
        AND a1.topic = a2.topic
        AND a1.mode = 'PVP' AND a2.mode = 'PVP'
        AND ABS(EXTRACT(EPOCH FROM (a1."createdAt" - a2."createdAt"))) < 10
        AND a1.id < a2.id
      WHERE (${targetUserId} = '' OR a1."userId" = ${targetUserId} OR a2."userId" = ${targetUserId})
        AND (${targetMode} = '' OR ${targetMode} = 'PVP')
    ),
    AiRows AS (
      SELECT 
        id as match_id,
        id as p1_id, "userId" as p1_user_id, score as p1_score, winner as p1_winner, "xpEarned" as p1_xp,
        NULL::text as p2_id, NULL::text as p2_user_id, 0 as p2_score, false as p2_winner, 0 as p2_xp,
        topic,
        'AI' as mode,
        "createdAt"
      FROM "ArenaResult"
      WHERE mode = 'AI'
        AND (${targetUserId} = '' OR "userId" = ${targetUserId})
        AND (${targetMode} = '' OR ${targetMode} = 'AI')
    ),
    AllMatches AS (
      SELECT * FROM PvpPairs
      UNION ALL
      SELECT * FROM AiRows
    )
    SELECT
      m.match_id as "id",
      m.mode,
      m.topic,
      m."createdAt",
      m.p1_score as "player1Score",
      m.p1_winner as "player1Winner",
      m.p1_xp as "player1Xp",
      u1.id as "player1Id",
      u1."displayName" as "player1Name",
      u1.username as "player1Username",
      sp1."studentCode" as "player1StudentCode",
      m.p2_score as "player2Score",
      m.p2_winner as "player2Winner",
      m.p2_xp as "player2Xp",
      u2.id as "player2Id",
      u2."displayName" as "player2Name",
      u2.username as "player2Username",
      sp2."studentCode" as "player2StudentCode"
    FROM AllMatches m
    JOIN "User" u1 ON m.p1_user_id = u1.id
    LEFT JOIN "StudentProfile" sp1 ON u1.id = sp1."userId"
    LEFT JOIN "User" u2 ON m.p2_user_id = u2.id
    LEFT JOIN "StudentProfile" sp2 ON u2.id = sp2."userId"
    ORDER BY m."createdAt" DESC
    LIMIT ${limit} OFFSET ${skip}
  `;

  const [countResult, matches] = await prisma.$transaction([
    prisma.$queryRaw(countQuery),
    prisma.$queryRaw(dataQuery)
  ]);

  const total = Array.isArray(countResult) && countResult.length > 0 ? Number(countResult[0].total) : 0;

  // Format response
  const formattedMatches = (matches as any[]).map(m => ({
    id: m.id,
    mode: m.mode,
    topic: m.topic,
    createdAt: m.createdAt,
    player1: {
      id: m.player1Id,
      displayName: m.player1Name,
      username: m.player1Username,
      studentCode: m.player1StudentCode,
      score: m.player1Score,
      winner: m.player1Winner,
      xpEarned: m.player1Xp,
    },
    player2: m.mode === 'AI' ? {
      id: null,
      displayName: 'Gia sư AI',
      username: null,
      studentCode: null,
      score: m.player1Winner ? Math.max(0, m.player1Score - Math.floor(Math.random() * 50) - 20) : (m.player1Score + Math.floor(Math.random() * 50) + 10),
      winner: !m.player1Winner,
      xpEarned: 0,
    } : {
      id: m.player2Id,
      displayName: m.player2Name,
      username: m.player2Username,
      studentCode: m.player2StudentCode,
      score: m.player2Score,
      winner: m.player2Winner,
      xpEarned: m.player2Xp,
    }
  }));

  return {
    data: formattedMatches,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

// ==========================================
// 4b. GET ARENA LOG DETAIL
// ==========================================
export async function getArenaLogDetail(id: string) {
  // Tìm record chính
  const mainRecord = await prisma.arenaResult.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          studentProfile: { select: { studentCode: true, grade: true, avatarUrl: true } },
          class: { select: { name: true } }
        }
      }
    }
  });

  if (!mainRecord) return null;

  if (mainRecord.mode === 'AI') {
    // Trận AI: chỉ có 1 record
    return {
      id: mainRecord.id,
      mode: 'AI',
      topic: mainRecord.topic,
      createdAt: mainRecord.createdAt,
      player1: {
        id: mainRecord.user.id,
        displayName: mainRecord.user.displayName,
        username: mainRecord.user.username,
        studentCode: mainRecord.user.studentProfile?.studentCode,
        grade: mainRecord.user.studentProfile?.grade,
        avatarUrl: mainRecord.user.studentProfile?.avatarUrl,
        className: mainRecord.user.class?.name,
        score: mainRecord.score,
        winner: mainRecord.winner,
        xpEarned: mainRecord.xpEarned,
      },
      player2: {
        id: null,
        displayName: 'Gia sư AI',
        username: null,
        score: mainRecord.winner ? Math.max(0, mainRecord.score - 45) : (mainRecord.score + 35),
        winner: !mainRecord.winner,
        xpEarned: 0,
      }
    };
  }

  // Trận PVP: tìm record đối thủ
  const opponentRecord = await prisma.arenaResult.findFirst({
    where: {
      mode: 'PVP',
      topic: mainRecord.topic,
      userId: { not: mainRecord.userId },
      createdAt: {
        gte: new Date(mainRecord.createdAt.getTime() - 10000),
        lte: new Date(mainRecord.createdAt.getTime() + 10000),
      }
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          studentProfile: { select: { studentCode: true, grade: true, avatarUrl: true } },
          class: { select: { name: true } }
        }
      }
    }
  });

  return {
    id: mainRecord.id,
    mode: 'PVP',
    topic: mainRecord.topic,
    createdAt: mainRecord.createdAt,
    player1: {
      id: mainRecord.user.id,
      displayName: mainRecord.user.displayName,
      username: mainRecord.user.username,
      studentCode: mainRecord.user.studentProfile?.studentCode,
      grade: mainRecord.user.studentProfile?.grade,
      avatarUrl: mainRecord.user.studentProfile?.avatarUrl,
      className: mainRecord.user.class?.name,
      score: mainRecord.score,
      winner: mainRecord.winner,
      xpEarned: mainRecord.xpEarned,
    },
    player2: opponentRecord ? {
      id: opponentRecord.user.id,
      displayName: opponentRecord.user.displayName,
      username: opponentRecord.user.username,
      studentCode: opponentRecord.user.studentProfile?.studentCode,
      grade: opponentRecord.user.studentProfile?.grade,
      avatarUrl: opponentRecord.user.studentProfile?.avatarUrl,
      className: opponentRecord.user.class?.name,
      score: opponentRecord.score,
      winner: opponentRecord.winner,
      xpEarned: opponentRecord.xpEarned,
    } : null,
  };
}

// ==========================================
// 5. GET USER ENGAGEMENT STATS
// ==========================================
export async function getUserEngagementStats() {
  // 5.1. Lấy Top 20 Streaks
  const topStreaks = await prisma.userStats.findMany({
    orderBy: { longestStreak: 'desc' },
    take: 20,
    include: {
      user: {
        select: { id: true, displayName: true, username: true }
      }
    }
  });

  // 5.2. Lấy toàn bộ UserStats kèm User để phân loại danh hiệu chi tiết
  const allStats = await prisma.userStats.findMany({
    include: {
      user: {
        select: { id: true, displayName: true, username: true }
      }
    }
  });

  const getRankName = (xp: number) => {
    if (xp <= 250) return 'NHÀ KHOA HỌC NHÍ';
    if (xp <= 500) return 'SỨ GIẢ CHÂN LÝ';
    if (xp <= 1000) return 'BẬC THẦY THỰC NGHIỆM';
    if (xp <= 1500) return 'HÀN LÂM HỌC SĨ';
    if (xp <= 2000) return 'NHÀ KIẾN TẠO TINH HOA';
    if (xp <= 2500) return 'HỌC GIẢ TINH ANH';
    return 'VỊ THẦN TRÍ THỨC';
  };

  const rankGroups: Record<string, any[]> = {};
  allStats.forEach(s => {
    const rank = getRankName(s.totalXp);
    if (!rankGroups[rank]) rankGroups[rank] = [];
    rankGroups[rank].push({
      id: s.user.id,
      displayName: s.user.displayName,
      username: s.user.username,
      totalXp: s.totalXp
    });
  });

  const formattedRankStats = Object.keys(rankGroups).map(rank => ({
    rank,
    count: rankGroups[rank].length,
    students: rankGroups[rank]
  }));

  return {
    topStreaks,
    rankDistribution: formattedRankStats
  };
}

// ==========================================
// 6. GET QUIZ LOGS (Revision History)
// ==========================================
export async function getQuizLogs(page = 1, limit = 50, keyword?: string) {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (keyword) {
    where.OR = [
      { user: { displayName: { contains: keyword, mode: "insensitive" } } },
      { user: { username: { contains: keyword, mode: "insensitive" } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.quizHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            studentProfile: { select: { studentCode: true } }
          }
        }
      }
    }),
    prisma.quizHistory.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

// ==========================================
// 7. GET ACTIVITY LOGS (Nhật ký hành động)
// ==========================================
export async function getActivityLogs(filters: {
  page?: number;
  limit?: number;
  source?: string;
  userId?: string;
  username?: string;
  module?: string;
  method?: string;
  statusGroup?: string; // "2xx", "4xx", "5xx"
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  minDuration?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  // Xây dựng điều kiện lọc
  const where: any = {};

  if (filters.source) where.source = filters.source;
  if (filters.userId) where.userId = filters.userId;
  if (filters.username) where.username = { contains: filters.username, mode: "insensitive" };
  if (filters.module) where.module = filters.module;
  if (filters.method) where.method = filters.method;
  
  if (filters.statusGroup) {
    if (filters.statusGroup === "2xx") where.statusCode = { gte: 200, lt: 300 };
    else if (filters.statusGroup === "4xx") where.statusCode = { gte: 400, lt: 500 };
    else if (filters.statusGroup === "5xx") where.statusCode = { gte: 500 };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (filters.search) {
    where.OR = [
      { action: { contains: filters.search, mode: "insensitive" } },
      { username: { contains: filters.search, mode: "insensitive" } },
      { path: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.minDuration) {
    where.durationMs = { gte: Number(filters.minDuration) };
  }

  // Thực hiện query
  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            displayName: true,
            studentProfile: { select: { avatarUrl: true } },
            teacherProfile: { select: { avatarUrl: true } }
          }
        }
      }
    }),
    prisma.activityLog.count({ where }),
  ]);

  // INLINE CLEANUP: Xóa logs cũ (không await để không block)
  (async () => {
    try {
      const retentionDaysStr = await getSystemConfig("LOG_RETENTION_DAYS");
      const retentionDays = parseInt(retentionDaysStr || "90");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);

      const deleteResult = await prisma.activityLog.deleteMany({
        where: { createdAt: { lt: cutoff } }
      });
      if (deleteResult.count > 0) {
        console.log(`[Cleanup] Đã xóa ${deleteResult.count} activity logs cũ hơn ${retentionDays} ngày.`);
      }
    } catch (err) {
      console.error("[Cleanup Error]", err);
    }
  })();

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

// ==========================================
// 7b. GET ACTIVITY LOG DETAIL
// ==========================================
export async function getActivityLogById(id: string) {
  return await prisma.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          displayName: true,
          username: true,
          role: true,
          studentProfile: { select: { avatarUrl: true, studentCode: true, grade: true } },
          teacherProfile: { select: { avatarUrl: true, employeeCode: true, subject: true } }
        }
      }
    }
  });
}

// ==========================================
// 8. GET ACTIVITY LOG SUMMARY
// ==========================================
export async function getActivityLogSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalToday,
    error4xxToday,
    error5xxToday,
    slowRequestsToday,
    totalAllTime,
    error4xxAllTime,
    error5xxAllTime,
    slowRequestsAllTime,
    topModules,
    sourceDistribution
  ] = await Promise.all([
    // Thống kê hôm nay
    prisma.activityLog.count({ where: { createdAt: { gte: today } } }),
    prisma.activityLog.count({ where: { createdAt: { gte: today }, statusCode: { gte: 400, lt: 500 } } }),
    prisma.activityLog.count({ where: { createdAt: { gte: today }, statusCode: { gte: 500 } } }),
    prisma.activityLog.count({ where: { createdAt: { gte: today }, durationMs: { gte: 2000 } } }),

    // Thống kê tổng quát (All-time)
    prisma.activityLog.count(),
    prisma.activityLog.count({ where: { statusCode: { gte: 400, lt: 500 } } }),
    prisma.activityLog.count({ where: { statusCode: { gte: 500 } } }),
    prisma.activityLog.count({ where: { durationMs: { gte: 2000 } } }),

    // Top 5 module hoạt động nhiều nhất
    prisma.activityLog.groupBy({
      by: ["module"],
      _count: { module: true },
      orderBy: { _count: { module: "desc" } },
      take: 5
    }),

    // Phân bổ theo nguồn
    prisma.activityLog.groupBy({
      by: ["source"],
      _count: { source: true }
    })
  ]);

  return {
    stats: {
      totalToday,
      error4xxToday,
      error5xxToday,
      slowRequestsToday,
      totalAllTime,
      error4xxAllTime,
      error5xxAllTime,
      slowRequestsAllTime,
    },
    topModules: topModules.map(m => ({ module: m.module, count: m._count.module })),
    sourceDistribution: sourceDistribution.map(s => ({ source: s.source, count: s._count.source }))
  };
}

// ==========================================
// 9. CLEAR ALL ACTIVITY LOGS
// ==========================================
export async function clearActivityLogs() {
  return await prisma.activityLog.deleteMany({});
}
