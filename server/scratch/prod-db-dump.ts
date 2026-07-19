import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TABLES = [
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

async function dumpRemote() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.error("❌ Please provide the target DATABASE_URL as an argument.");
    process.exit(1);
  }

  console.log(`🔌 Connecting to target database: ${targetUrl.replace(/:[^:@/]+@/, ':****@')}`);
  const pool = new Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prismaTarget = new PrismaClient({ adapter });

  console.log("🚀 Starting database dump from Production PostgreSQL...");
  const dumpData: Record<string, any[]> = {};

  for (const model of TABLES) {
    try {
      console.log(`- Fetching ${model}...`);
      const records = await (prismaTarget as any)[model].findMany();
      dumpData[model] = records;
      console.log(`  Read ${records.length} records.`);
    } catch (err: any) {
      console.error(`❌ Error reading model ${model}:`, err.message);
      process.exit(1);
    }
  }

  const outputPath = path.join(__dirname, 'prod_db_dump.json');
  try {
    fs.writeFileSync(outputPath, JSON.stringify(dumpData, null, 2), 'utf-8');
    console.log(`\n✅ Database dump successful! File saved to: ${outputPath}`);
  } catch (err: any) {
    console.error("❌ Failed to write JSON dump file:", err.message);
    process.exit(1);
  } finally {
    await prismaTarget.$disconnect();
  }
}

dumpRemote();
