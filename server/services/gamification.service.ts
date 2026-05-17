import { XpAction, ChallengeType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../utils/errors.js";

// ========================
// CONSTANTS & UTILS
// ========================

export const LEVELS = [
  { minXp: 0, maxXp: 250, title: "NHÀ KHOA HỌC NHÍ" },
  { minXp: 250, maxXp: 500, title: "SỨ GIẢ CHÂN LÝ" },
  { minXp: 500, maxXp: 1000, title: "BẬC THẦY THỰC NGHIỆM" },
  { minXp: 1000, maxXp: 1500, title: "HÀN LÂM HỌC SĨ" },
  { minXp: 1500, maxXp: 2000, title: "NHÀ KIẾN TẠO TINH HOA" },
  { minXp: 2000, maxXp: 2500, title: "Học Giả Tinh Anh" },
  { minXp: 2500, maxXp: Infinity, title: "Vị Thần Tri Thức" },
];

/**
 * Tính toán cấp độ và danh hiệu dựa trên EXP
 */
export function getLevelInfo(xp: number) {
  const level = LEVELS.find((l) => xp >= l.minXp && xp < l.maxXp) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1] || null;

  return {
    currentTitle: level.title,
    xp,
    minXp: level.minXp,
    maxXp: level.maxXp,
    nextTitle: nextLevel?.title || "MAX",
    progress: nextLevel ? ((xp - level.minXp) / (level.maxXp - level.minXp)) * 100 : 100,
  };
}

// ========================
// CORE LOGIC
// ========================

/**
 * Cộng hoặc trừ EXP cho người dùng (Đảm bảo không < 0)
 */
export async function addXp(userId: string, amount: number, action: XpAction, referenceId?: string, tx?: any) {
  const client = tx || prisma;
  
  // Lấy stats hiện tại để kiểm tra nếu bị trừ quá 0
  const currentStats = await client.userStats.findUnique({
    where: { userId }
  });

  let incrementAmount = amount;
  if (amount < 0 && currentStats) {
    // Nếu trừ nhiều hơn số đang có, chỉ trừ về 0
    if (currentStats.totalXp + amount < 0) {
      incrementAmount = -currentStats.totalXp;
    }
  }

  const stats = await client.userStats.upsert({
    where: { userId },
    update: {
      totalXp: { increment: incrementAmount },
      weeklyXp: { increment: Math.max(- (currentStats?.weeklyXp || 0), incrementAmount) },
    },
    create: {
      userId,
      totalXp: Math.max(0, incrementAmount),
      weeklyXp: Math.max(0, incrementAmount),
    },
  });

  await client.xpLog.create({
    data: {
      userId,
      amount: incrementAmount,
      action,
      referenceId,
    },
  });

  return stats;
}

/**
 * Cộng điểm (Points) cho người dùng
 */
export async function addPoints(userId: string, amount: number, tx?: any) {
  const client = tx || prisma;
  return await client.userStats.update({
    where: { userId },
    data: { points: { increment: amount } },
  });
}

/**
 * Kiểm tra và cộng thưởng đăng nhập hàng ngày + cập nhật Streak
 */
export async function checkDailyLogin(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00:00 hôm nay

  // Lấy stats hiện tại (hoặc tạo mới nếu chưa có)
  let stats = await prisma.userStats.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const lastStudy = stats.lastStudyDate;

  // Nếu lastStudyDate đã là hôm nay → đã tính rồi, bỏ qua
  if (lastStudy) {
    const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());
    if (lastStudyDay.getTime() === todayStart.getTime()) {
      return { rewarded: false };
    }
  }

  // Tính toán streak mới
  let newStreak = 1; // Mặc định bắt đầu streak mới

  if (lastStudy) {
    const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    if (lastStudyDay.getTime() === yesterdayStart.getTime()) {
      // Đăng nhập liên tiếp (hôm qua cũng đăng nhập) → tăng streak
      newStreak = stats.currentStreak + 1;
    }
    // Nếu lastStudyDay < yesterdayStart → streak bị đứt → reset về 1
  }

  const newLongestStreak = Math.max(stats.longestStreak, newStreak);

  await prisma.$transaction(async (tx) => {
    // Cập nhật streak và lastStudyDate trong UserStats
    await tx.userStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: now,
        points: { increment: 5 },
      },
    });

    // Cập nhật lastLoginAt trên User
    await tx.user.update({
      where: { id: userId },
      data: { lastLoginAt: now },
    });

    // Ghi log XP
    await tx.xpLog.create({
      data: {
        userId,
        amount: 0,
        action: "DAILY_LOGIN",
      },
    });
  });

  return { rewarded: true, points: 5, currentStreak: newStreak, longestStreak: newLongestStreak };
}

// ========================
// CHALLENGES
// ========================

/**
 * Cập nhật tiến độ thử thách
 */
export async function updateChallengeProgress(userId: string, challengeKey: string, increment: number = 1, tx?: any) {
  const client = tx || prisma;

  const challenge = await client.challenge.findUnique({
    where: { key: challengeKey },
  });

  if (!challenge) return null;

  const userChallenge = await client.userChallenge.upsert({
    where: { userId_challengeId: { userId, challengeId: challenge.id } },
    update: {
      progress: { increment },
    },
    create: {
      userId,
      challengeId: challenge.id,
      progress: increment,
    },
  });

  // Kiểm tra hoàn thành
  if (!userChallenge.isCompleted && userChallenge.progress + increment >= challenge.goal) {
    // Nếu tx được truyền vào, sử dụng nó. Nếu không, tạo một transaction mới.
    const executeLogic = async (t: any) => {
      const updated = await t.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          isCompleted: true,
          progress: challenge.goal,
          lastCompletedAt: new Date(),
        },
      });

      // Cộng thưởng
      if (challenge.xpReward > 0) {
        await addXp(userId, challenge.xpReward, XpAction.QUEST_COMPLETED, challenge.id, t);
      }

      if (challenge.pointsReward > 0) {
        await addPoints(userId, challenge.pointsReward, t);
      }

      return { ...updated, completedNow: true, reward: { xp: challenge.xpReward, points: challenge.pointsReward } };
    };

    if (tx) {
      return await executeLogic(tx);
    } else {
      return await prisma.$transaction(executeLogic);
    }
  }

  return userChallenge;
}

/**
 * Khởi tạo các thử thách mặc định
 */
export async function seedChallenges() {
  const challenges = [
    {
      key: "S_GIA_CAU_HOI",
      name: "Sứ Giả Câu Hỏi",
      description: "Gửi 3 câu hỏi cho AI",
      xpReward: 50,
      goal: 3,
      type: ChallengeType.DAILY,
    },
    {
      key: "CHIEN_BINH_TRI_TUE",
      name: "Chiến Binh Trí Tuệ",
      description: "Hoàn thành 1 bài trắc nghiệm",
      xpReward: 50,
      goal: 1,
      type: ChallengeType.DAILY,
    },
    {
      key: "CHIEN_BINH_DA_TAI",
      name: "Chiến Binh Đa Tài",
      description: "Ôn tập 2 chủ đề khác nhau và hoàn thành Quiz Flashcard",
      xpReward: 100,
      goal: 1,
      type: ChallengeType.DAILY,
    },
  ];

  for (const c of challenges) {
    await prisma.challenge.upsert({
      where: { key: c.key },
      update: c,
      create: c,
    });
  }
}

// ========================
// RANKING
// ========================

/**
 * Lấy bảng xếp hạng tuần
 */
export async function getWeeklyLeaderboard(limit: number = 10) {
  const topUsers = await prisma.userStats.findMany({
    take: limit,
    orderBy: { weeklyXp: "desc" },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          studentProfile: { select: { avatarUrl: true, grade: true } },
        },
      },
    },
  });

  return topUsers.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    displayName: s.user.displayName,
    avatarUrl: s.user.studentProfile?.avatarUrl,
    weeklyXp: s.weeklyXp,
    level: getLevelInfo(s.totalXp).currentTitle,
  }));
}

/**
 * Reset xếp hạng tuần (Cron job)
 */
export async function resetWeeklyXp() {
  return await prisma.userStats.updateMany({
    data: { weeklyXp: 0 },
  });
}
