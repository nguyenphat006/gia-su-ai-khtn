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
 * Cộng EXP cho người dùng
 */
export async function addXp(userId: string, amount: number, action: XpAction, referenceId?: string, tx?: any) {
  const client = tx || prisma;
  
  const stats = await client.userStats.upsert({
    where: { userId },
    update: {
      totalXp: { increment: amount },
      weeklyXp: { increment: amount },
    },
    create: {
      userId,
      totalXp: amount,
      weeklyXp: amount,
    },
  });

  await client.xpLog.create({
    data: {
      userId,
      amount,
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
 * Kiểm tra và cộng thưởng đăng nhập hàng ngày
 */
export async function checkDailyLogin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLoginAt: true },
  });

  if (!user) return;

  const now = new Date();
  const lastLogin = user.lastLoginAt;

  // Nếu hôm nay chưa nhận thưởng (so sánh ngày)
  const isSameDay = lastLogin && 
    lastLogin.getDate() === now.getDate() &&
    lastLogin.getMonth() === now.getMonth() &&
    lastLogin.getFullYear() === now.getFullYear();

  if (!isSameDay) {
    await prisma.$transaction(async (tx) => {
      // Cập nhật lastLoginAt
      await tx.user.update({
        where: { id: userId },
        data: { lastLoginAt: now },
      });

      // Cộng 5 điểm (Sử dụng upsert để an toàn nếu chưa có record stats)
      await tx.userStats.upsert({
        where: { userId },
        update: { points: { increment: 5 } },
        create: {
          userId,
          points: 5,
        },
      });

      // Ghi log
      await tx.xpLog.create({
        data: {
          userId,
          amount: 0,
          action: "DAILY_LOGIN",
        },
      });
    });
    
    return { rewarded: true, points: 5 };
  }

  return { rewarded: false };
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
