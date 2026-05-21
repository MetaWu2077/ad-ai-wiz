import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const sessions = await db.session.findMany({ take: 5 });
console.log("Sessions in DB:", sessions.length);
sessions.forEach(s => {
  console.log(`  shop=${s.shop} isOnline=${s.isOnline} expires=${s.expires} scope=${s.scope?.slice(0,30)}`);
});
await db.$disconnect();
