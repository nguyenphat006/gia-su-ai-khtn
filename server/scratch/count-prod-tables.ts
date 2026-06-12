import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error("❌ Please specify DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: targetUrl,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prismaTarget = new PrismaClient({ adapter });

async function count() {
  const models = [
    'class',
    'user',
    'studentProfile',
    'teacherProfile',
    'userStats',
    'xpLog',
    'authSession',
    'challenge',
    'userChallenge',
    'systemConfig',
    'knowledgeDocument',
    'sourceDocument',
    'questionBank',
    'flashcardDeck',
    'mindmapData',
    'quizHistory',
    'arenaResult',
    'activityLog',
    'chatSession',
    'chatMessage'
  ];

  console.log("=== PRODUCTION DB STATUS ===");
  for (const model of models) {
    try {
      const count = await (prismaTarget as any)[model].count();
      console.log(`- ${model}: ${count} records`);
    } catch (err: any) {
      console.log(`- ${model}: Error -> ${err.message}`);
    }
  }
  await prismaTarget.$disconnect();
}

count();
