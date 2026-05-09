import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

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
  // Vì Prisma không hỗ trợ group by theo expression trực tiếp (như HOUR(createdAt)) một cách dễ dàng
  // Ta sẽ dùng query thô (raw query) cho PostgreSQL
  
  const rawData: any[] = await prisma.$queryRaw`
    SELECT 
      EXTRACT(DOW FROM "createdAt") as "dayOfWeek",
      EXTRACT(HOUR FROM "createdAt") as "hourOfDay",
      COUNT(*) as "actionCount"
    FROM "XpLog"
    GROUP BY EXTRACT(DOW FROM "createdAt"), EXTRACT(HOUR FROM "createdAt")
    ORDER BY "dayOfWeek", "hourOfDay";
  `;

  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return rawData.map(row => ({
    dayOfWeek: Number(row.dayOfWeek),
    hourOfDay: Number(row.hourOfDay),
    actionCount: Number(row.actionCount)
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

  // 5.2. Tính phân bổ cấp độ (Ranks Distribution)
  const rankStats: any[] = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN "totalXp" <= 250 THEN 'NHÀ KHOA HỌC NHÍ'
        WHEN "totalXp" > 250 AND "totalXp" <= 500 THEN 'SỨ GIẢ CHÂN LÝ'
        WHEN "totalXp" > 500 AND "totalXp" <= 1000 THEN 'BẬC THẦY THỰC NGHIỆM'
        WHEN "totalXp" > 1000 AND "totalXp" <= 1500 THEN 'HÀN LÂM HỌC SĨ'
        WHEN "totalXp" > 1500 AND "totalXp" <= 2000 THEN 'NHÀ KIẾN TẠO TINH HOA'
        WHEN "totalXp" > 2000 AND "totalXp" <= 2500 THEN 'HỌC GIẢ TINH ANH'
        ELSE 'VỊ THẦN TRÍ THỨC'
      END as rank,
      COUNT(*) as count
    FROM "UserStats"
    GROUP BY rank;
  `;

  // Chuyển BigInt count sang Number để JSON.stringify không bị lỗi
  const formattedRankStats = rankStats.map(r => ({
    rank: r.rank,
    count: Number(r.count)
  }));

  return {
    topStreaks,
    rankDistribution: formattedRankStats
  };
}
