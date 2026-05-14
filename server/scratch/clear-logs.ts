import { prisma } from "../config/prisma.js";

async function main() {
  const result = await prisma.activityLog.deleteMany({});
  console.log(`Đã xóa sạch ${result.count} nhật ký hoạt động.`);
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
