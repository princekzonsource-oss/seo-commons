// scripts/clear-data.ts
// Use: node scripts/clear-data.ts
// WARNING: Deletes all posts, comments, votes, bookmarks, follows, notifications, etc.
// Designed to clear seeded fake data for production ready.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearData() {
  console.log("Clearing seeded data...");

  // Delete in reverse FK order
  await prisma.notification.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany(); // tags remain (could delete if desired)

  // Optionally delete seed users (with clerkId starting with "seed_clerk_")
  // Uncomment to delete seed users (danger: removes auth for test accounts)
  // await prisma.user.deleteMany({
  //   where: { clerkId: { startsWith: "seed_clerk_" } },
  // });

  console.log("Data cleared successfully.");
}

if (require.main === module) {
  clearData()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error("Error clearing data:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}