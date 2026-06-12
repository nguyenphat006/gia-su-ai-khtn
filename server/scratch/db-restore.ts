import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

const REVERSE_TABLES = [...TABLES].reverse();

function parseDates(obj: any, parentKey?: string): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    const isoDateRegRef = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoDateRegRef.test(obj)) {
      const parsed = new Date(obj);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => parseDates(item, parentKey));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      // Exclude JSON fields from parsing dates
      if (['options', 'cards', 'attachments', 'queryParams', 'requestBody'].includes(key)) {
        newObj[key] = obj[key];
      } else {
        newObj[key] = parseDates(obj[key], key);
      }
    }
    return newObj;
  }
  return obj;
}

async function restore() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.error("❌ Error: Please provide the target DATABASE_URL as the first argument.");
    console.error("Example: npx tsx scratch/db-restore.ts \"postgresql://user:pass@host:port/db\"");
    process.exit(1);
  }

  const dumpPath = path.join(__dirname, 'local_db_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`❌ Error: Dump file not found at ${dumpPath}. Run dump script first.`);
    process.exit(1);
  }

  console.log("📖 Reading dump file...");
  const dumpData = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

  console.log(`🔌 Connecting to target database: ${targetUrl.replace(/:[^:@/]+@/, ':****@')}`);
  const pool = new Pool({
    connectionString: targetUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  const adapter = new PrismaPg(pool);
  const prismaTarget = new PrismaClient({
    adapter
  });

  try {
    // 1. Clean existing records in reverse order
    console.log("\n🧹 Cleaning existing data in target database...");
    for (const model of REVERSE_TABLES) {
      try {
        const deleted = await (prismaTarget as any)[model].deleteMany({});
        console.log(`  Cleared ${deleted.count} records from ${model}.`);
      } catch (err: any) {
        console.warn(`  ⚠️ Warning during cleanup of ${model}:`, err.message);
      }
    }

    // 2. Insert records in topological order
    console.log("\n📥 Restoring data to target database...");
    for (const model of TABLES) {
      const records = dumpData[model];
      if (records && records.length > 0) {
        console.log(`- Restoring ${model} (${records.length} records)...`);
        const parsedRecords = records.map((r: any) => parseDates(r));
        
        // Use batching to prevent payload size issues
        const chunkSize = 100;
        for (let i = 0; i < parsedRecords.length; i += chunkSize) {
          const chunk = parsedRecords.slice(i, i + chunkSize);
          await (prismaTarget as any)[model].createMany({
            data: chunk
          });
        }
        console.log(`  ✅ Successfully restored ${records.length} records.`);
      } else {
        console.log(`- ${model}: No records to restore.`);
      }
    }

    console.log("\n🎉 Database restoration completed successfully!");
  } catch (err: any) {
    console.error("\n❌ Fatal error during restore:", err);
    process.exit(1);
  } finally {
    await prismaTarget.$disconnect();
  }
}

restore();
