import 'dotenv/config';
import { prisma } from "../config/prisma.js";

async function testStreak() {
  // Lấy 1 user student bất kỳ
  const user = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
    include: { stats: true }
  });

  if (!user) {
    console.log("Không tìm thấy user STUDENT nào");
    return;
  }

  console.log("=== BEFORE ===");
  console.log("User:", user.displayName, "(", user.id, ")");
  console.log("Stats:", {
    currentStreak: user.stats?.currentStreak,
    longestStreak: user.stats?.longestStreak,
    lastStudyDate: user.stats?.lastStudyDate,
  });

  // Import và gọi checkDailyLogin
  const { checkDailyLogin } = await import("../services/gamification.service.js");
  const result = await checkDailyLogin(user.id);
  console.log("\n=== checkDailyLogin result ===");
  console.log(result);

  // Đọc lại stats sau khi gọi
  const updatedStats = await prisma.userStats.findUnique({
    where: { userId: user.id }
  });
  console.log("\n=== AFTER ===");
  console.log("Stats:", {
    currentStreak: updatedStats?.currentStreak,
    longestStreak: updatedStats?.longestStreak,
    lastStudyDate: updatedStats?.lastStudyDate,
  });

  await prisma.$disconnect();
}

testStreak().catch(e => {
  console.error(e);
  process.exit(1);
});
