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

async function restoreRemote() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.error("❌ Please provide the target DATABASE_URL as an argument.");
    process.exit(1);
  }

  const dumpPath = path.join(__dirname, 'prod_db_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`❌ Dump file not found: ${dumpPath}`);
    process.exit(1);
  }

  console.log("📂 Reading dump file...");
  const rawData = fs.readFileSync(dumpPath, 'utf-8');
  const dumpData = JSON.parse(rawData);

  console.log(`🔌 Connecting to target database: ${targetUrl.replace(/:[^:@/]+@/, ':****@')}`);
  const pool = new Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prismaTarget = new PrismaClient({ adapter });

  console.log("🚀 Starting database restore to new PostgreSQL...");

  for (const model of TABLES) {
    const records = dumpData[model];
    if (!records || records.length === 0) {
      console.log(`- Skipping ${model} (0 records)`);
      continue;
    }

    try {
      console.log(`- Restoring ${model} (${records.length} records)...`);
      // Use createMany to insert records while keeping their original IDs
      await (prismaTarget as any)[model].createMany({
        data: records,
        skipDuplicates: true // Just in case
      });
      console.log(`  ✅ Inserted ${records.length} records.`);
    } catch (err: any) {
      console.error(`❌ Error restoring model ${model}:`, err.message);
      // We don't exit on error so it can try the other tables
    }
  }

  console.log(`\n✅ Database restore completed!`);
  await prismaTarget.$disconnect();
}

restoreRemote();
