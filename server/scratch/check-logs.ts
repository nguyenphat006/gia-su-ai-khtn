import { prisma } from "../config/prisma.js";

async function main() {
  const count = await prisma.activityLog.count();
  console.log(`Số lượng nhật ký hoạt động hiện tại: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
