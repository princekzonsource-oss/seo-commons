import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const cu = await currentUser();
  if (!cu) return null;

  const email = cu.emailAddresses[0]?.emailAddress ?? `${userId}@example.com`;
  const username =
    cu.username ??
    cu.firstName?.toLowerCase().replace(/\s+/g, "") ??
    email.split("@")[0].replace(/[^a-z0-9_]/gi, "") ??
    `user_${userId.slice(0, 8)}`;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name: cu.fullName ?? cu.firstName ?? null,
      avatarUrl: cu.imageUrl ?? null,
    },
    create: {
      clerkId: userId,
      username,
      email,
      name: cu.fullName ?? cu.firstName ?? null,
      avatarUrl: cu.imageUrl ?? null,
    },
  });

  return user;
}