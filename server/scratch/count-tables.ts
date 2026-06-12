import 'dotenv/config';
import { prisma } from "../config/prisma.js";

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
    'chatSession',
    'chatMessage',
    'questionBank',
    'sourceDocument',
    'flashcardDeck',
    'mindmapData',
    'quizHistory',
    'arenaResult',
    'activityLog'
  ];

  console.log("=== LOCAL DB STATUS ===");
  for (const model of models) {
    try {
      const count = await (prisma as any)[model].count();
      console.log(`- ${model}: ${count} records`);
    } catch (err: any) {
      console.log(`- ${model}: Error -> ${err.message}`);
    }
  }
  await prisma.$disconnect();
}

count();
