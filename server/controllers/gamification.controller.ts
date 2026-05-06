import { Request, Response, NextFunction } from "express";
import * as gamificationService from "../services/gamification.service.js";
import { prisma } from "../config/prisma.js";

/**
 * Lấy danh sách thử thách của người dùng hiện tại
 */
export async function getMyChallenges(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.auth;
    if (!user) {
      return res.status(401).json({ message: "Không xác thực" });
    }
    
    const challenges = await prisma.challenge.findMany({
      include: {
        userChallenges: {
          where: { userId: user.userId }
        }
      }
    });

    const result = challenges.map(c => ({
      id: c.id,
      key: c.key,
      name: c.name,
      description: c.description,
      xpReward: c.xpReward,
      pointsReward: c.pointsReward,
      goal: c.goal,
      type: c.type,
      progress: c.userChallenges[0]?.progress || 0,
      isCompleted: c.userChallenges[0]?.isCompleted || false
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy bảng xếp hạng tuần
 */
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const leaderboard = await gamificationService.getWeeklyLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy thông tin cấp độ của user hiện tại
 */
export async function getMyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.auth;
    if (!user) {
      return res.status(401).json({ message: "Không xác thực" });
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: user.userId }
    });

    if (!stats) {
      return res.json(gamificationService.getLevelInfo(0));
    }

    const levelInfo = gamificationService.getLevelInfo(stats.totalXp);
    res.json({
      ...levelInfo,
      weeklyXp: stats.weeklyXp,
      points: stats.points,
      currentStreak: stats.currentStreak
    });
  } catch (error) {
    next(error);
  }
}
