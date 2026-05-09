import 'dotenv/config';
import { prisma } from "../config/prisma.js";
import { getArenaLogs, getArenaLogDetail } from "../services/report.service.js";

async function testArena() {
  console.log("=== TEST 1: getArenaLogs (tất cả) ===");
  const allLogs = await getArenaLogs(1, 10);
  console.log("Total:", allLogs.pagination.total);
  allLogs.data.forEach(m => {
    console.log(`[${m.mode}] ${m.player1.displayName} (${m.player1.score}) vs ${m.player2.displayName} (${m.player2.score}) | topic=${m.topic}`);
  });

  console.log("\n=== TEST 2: getArenaLogs (chỉ PVP) ===");
  const pvpLogs = await getArenaLogs(1, 10, undefined, 'PVP');
  console.log("Total PVP matches:", pvpLogs.pagination.total);
  pvpLogs.data.forEach(m => {
    console.log(`[${m.mode}] ${m.player1.displayName} (${m.player1.score}) vs ${m.player2.displayName} (${m.player2.score})`);
  });

  console.log("\n=== TEST 3: getArenaLogs (chỉ AI) ===");
  const aiLogs = await getArenaLogs(1, 10, undefined, 'AI');
  console.log("Total AI matches:", aiLogs.pagination.total);
  aiLogs.data.forEach(m => {
    console.log(`[${m.mode}] ${m.player1.displayName} (${m.player1.score}) vs ${m.player2.displayName} (${m.player2.score})`);
  });

  if (allLogs.data.length > 0) {
    const firstMatch = allLogs.data[0];
    console.log(`\n=== TEST 4: getArenaLogDetail (id=${firstMatch.id}) ===`);
    const detail = await getArenaLogDetail(firstMatch.id);
    console.log(JSON.stringify(detail, null, 2));
  }

  await prisma.$disconnect();
}

testArena().catch(e => { console.error(e); process.exit(1); });
