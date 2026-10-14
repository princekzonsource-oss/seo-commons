import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "COMMENT_ON_POST"
  | "REPLY_TO_COMMENT"
  | "POST_UPVOTE"
  | "COMMENT_UPVOTE"
  | "FOLLOW"
  | "ACCEPTED_ANSWER";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  referenceId: string;
  title: string;
  body?: string | null;
}) {
  if (!input.userId) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      referenceId: input.referenceId,
      title: input.title,
      body: input.body ?? null,
    },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}