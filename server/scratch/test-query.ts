import 'dotenv/config';
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

async function test() {
  const limit = 5;
  const skip = 0;
  const searchKeyword = '';
  const targetUserId = '';

  const countQuery = Prisma.sql`
    WITH RankedMessages AS (
      SELECT 
        id, 
        "sessionId", 
        role::text as role_text, 
        content, 
        "createdAt",
        LEAD(role::text) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_role_text,
        LEAD(content) OVER (PARTITION BY "sessionId" ORDER BY "createdAt") as next_content
      FROM "ChatMessage"
    ),
    Pairs AS (
      SELECT
        "sessionId",
        content as user_content,
        next_content as model_content
      FROM RankedMessages
      WHERE role_text = 'USER' AND next_role_text = 'MODEL'
    )
    SELECT COUNT(*)::int as total
    FROM Pairs p
    JOIN "ChatSession" s ON p."sessionId" = s.id
    WHERE (${searchKeyword} = '' OR p.user_content ILIKE ${searchKeyword} OR p.model_content ILIKE ${searchKeyword})
      AND (${targetUserId} = '' OR s."userId" = ${targetUserId})
  `;

  try {
    const res = await prisma.$queryRaw(countQuery);
    console.log("COUNT RESULT:", res);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
