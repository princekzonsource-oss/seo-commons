const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const posts = await prisma.post.findMany({ select: { id: true, content: true } });
  for (const p of posts) {
    await prisma.post.update({ where: { id: p.id }, data: { excerpt: p.content.slice(0, 100).replace(/\n/g, " ") } });
  }
  console.log("updated", posts.length);
  await prisma.$disconnect();
})().catch(e=>{console.error(e); process.exit(1)});