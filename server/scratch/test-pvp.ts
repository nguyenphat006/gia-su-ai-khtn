import 'dotenv/config';
import { prisma } from "../config/prisma.js";

async function testPvp() {
  // Xem cấu trúc data thực tế
  const results = await prisma.arenaResult.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, displayName: true, username: true } }
    }
  });

  console.log("Total ArenaResult records:", await prisma.arenaResult.count());
  console.log("PVP records:", await prisma.arenaResult.count({ where: { mode: 'PVP' } }));
  console.log("AI records:", await prisma.arenaResult.count({ where: { mode: 'AI' } }));
  console.log("\n--- Sample data ---");
  results.forEach(r => {
    console.log(`[${r.mode}] ${r.user.displayName} vs ${r.opponent} | score=${r.score} winner=${r.winner} topic=${r.topic} | ${r.createdAt.toISOString()}`);
  });

  await prisma.$disconnect();
}

testPvp().catch(e => { console.error(e); process.exit(1); });
