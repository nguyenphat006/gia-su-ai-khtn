import 'dotenv/config';
import { prisma } from "../config/prisma.js";

async function clean() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });

  console.log("🧹 Cleaning local admin chat history...");
  for (const admin of admins) {
    const adminId = admin.id;

    // Delete chat messages in sessions belonging to this admin
    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: {
        session: {
          userId: adminId
        }
      }
    });
    console.log(`- Deleted ${deletedMessages.count} chat messages for admin: ${admin.username}`);

    // Delete chat sessions belonging to this admin
    const deletedSessions = await prisma.chatSession.deleteMany({
      where: {
        userId: adminId
      }
    });
    console.log(`- Deleted ${deletedSessions.count} chat sessions for admin: ${admin.username}`);
  }

  await prisma.$disconnect();
  console.log("✅ Local admin chat history cleared.");
}

clean();
