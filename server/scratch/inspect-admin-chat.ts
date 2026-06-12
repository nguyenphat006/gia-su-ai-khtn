import 'dotenv/config';
import { prisma } from "../config/prisma.js";

async function inspect() {
  // Find ADMIN user
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });

  console.log("=== ADMIN USERS ===");
  console.log(admins.map(u => ({ id: u.id, username: u.username, displayName: u.displayName })));

  for (const admin of admins) {
    const chatSessionCount = await prisma.chatSession.count({
      where: { userId: admin.id }
    });
    const chatMessageCount = await prisma.chatMessage.count({
      where: { session: { userId: admin.id } }
    });
    console.log(`Admin ${admin.username} (${admin.id}):`);
    console.log(`- Chat Sessions: ${chatSessionCount}`);
    console.log(`- Chat Messages: ${chatMessageCount}`);
  }

  await prisma.$disconnect();
}

inspect();
