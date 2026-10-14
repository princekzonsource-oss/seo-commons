"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

async function refreshPost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { slug: true } });
  if (post) revalidatePath(`/posts/${post.slug}`);
}

export async function votePost(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const postId = String(formData.get("postId"));
  const value = Number(formData.get("value"));
  if (value !== 1 && value !== -1) throw new Error("Invalid vote");

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, slug: true, title: true } });
  if (!post) throw new Error("Not found");

  const existing = await prisma.vote.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (!existing) {
    await prisma.vote.create({ data: { userId: user.id, postId, value } });
    if (post.authorId !== user.id) {
      await prisma.user.update({ where: { id: post.authorId }, data: { reputation: { increment: value } } });
      if (value === 1) {
        await createNotification({
          userId: post.authorId,
          type: "POST_UPVOTE",
          referenceId: postId,
          title: "Your post was upvoted",
          body: post.title,
        });
      }
    }
  } else if (existing.value === value) {
    await prisma.vote.delete({ where: { userId_postId: { userId: user.id, postId } } });
    if (post.authorId !== user.id) {
      await prisma.user.update({ where: { id: post.authorId }, data: { reputation: { increment: -existing.value } } });
    }
  } else {
    await prisma.vote.update({
      where: { userId_postId: { userId: user.id, postId } },
      data: { value },
    });
    if (post.authorId !== user.id) {
      await prisma.user.update({ where: { id: post.authorId }, data: { reputation: { increment: value - existing.value } } });
      if (value === 1) {
        await createNotification({
          userId: post.authorId,
          type: "POST_UPVOTE",
          referenceId: postId,
          title: "Your post was upvoted",
          body: post.title,
        });
      }
    }
  }

  await refreshPost(postId);
}
export async function addComment(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const postId = String(formData.get("postId"));
  const content = String(formData.get("content") ?? "").trim();
  const parentIdRaw = formData.get("parentId");
  const parentId = parentIdRaw ? String(parentIdRaw) : null;
  if (!content) throw new Error("Empty comment");

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, slug: true, title: true } });
  if (!post) throw new Error("Not found");

  await prisma.comment.create({
    data: { content, authorId: user.id, postId, parentId },
  });

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
    if (parent && parent.authorId !== user.id) {
      await createNotification({
        userId: parent.authorId,
        type: "REPLY_TO_COMMENT",
        referenceId: postId,
        title: "New reply to your comment",
        body: content.slice(0, 120),
      });
    }
  } else if (post.authorId !== user.id) {
    await createNotification({
      userId: post.authorId,
      type: "COMMENT_ON_POST",
      referenceId: postId,
      title: "New comment on your post",
      body: content.slice(0, 120),
    });
  }

  await refreshPost(postId);
}

export async function markNotificationRead(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  const id = String(formData.get("id"));
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function acceptAnswer(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  const commentId = String(formData.get("commentId"));
  const postId = String(formData.get("postId"));

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, slug: true, type: true } });
  if (!post || post.authorId !== user.id) throw new Error("Forbidden");

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true, postId: true } });
  if (!comment || comment.postId !== postId) throw new Error("Not found");

  await prisma.comment.updateMany({ where: { postId }, data: { isAccepted: false } });
  await prisma.comment.update({ where: { id: commentId }, data: { isAccepted: true } });

  if (comment.authorId !== user.id) {
    await prisma.user.update({ where: { id: comment.authorId }, data: { reputation: { increment: 15 } } });
  }

  await createNotification({
    userId: comment.authorId,
    type: "ACCEPTED_ANSWER",
    referenceId: postId,
    title: "Your answer was accepted",
  });

  revalidatePath(`/posts/${post.slug}`);
}

export async function deleteComment(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const commentId = String(formData.get("commentId"));
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true, postId: true } });
  if (!comment || comment.authorId !== user.id) throw new Error("Forbidden");

  await prisma.comment.delete({ where: { id: commentId } });
  await refreshPost(comment.postId);
}

export async function deletePost(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const postId = String(formData.get("postId"));
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post || post.authorId !== user.id) throw new Error("Forbidden");

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/");
  redirect("/");
}

export async function updatePost(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const id = String(formData.get("postId"));
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();

  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true, slug: true } });
  if (!post || post.authorId !== user.id) throw new Error("Forbidden");

  const tagNames = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      excerpt: content.slice(0, 100).replace(/\n/g, " "),
      coverImage: coverImage || null,
      type: (type || undefined) as import("@prisma/client").PostType | undefined,
      tags: {
        set: [],
        connectOrCreate: tagNames.map((name) => {
          const s = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          return { where: { slug: s }, create: { name, slug: s } };
        }),
      },
    },
  });

  revalidatePath(`/posts/${post.slug}`);
  redirect(`/posts/${post.slug}`);
}

export async function toggleFollow(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  const followingId = String(formData.get("followingId"));
  if (followingId === user.id) throw new Error("Cannot follow yourself");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { followerId_followingId: { followerId: user.id, followingId } } });
  } else {
    await prisma.follow.create({ data: { followerId: user.id, followingId } });
    await createNotification({
      userId: followingId,
      type: "FOLLOW",
      referenceId: followingId,
      title: "New follower",
    });
    await prisma.user.update({ where: { id: followingId }, data: { reputation: { increment: 1 } } });
  }
  revalidatePath(`/users/${(await prisma.user.findUnique({ where: { id: followingId }, select: { username: true } }))?.username ?? ""}`);
}

export async function toggleBookmark(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  const postId = String(formData.get("postId"));
  const existing = await prisma.bookmark.findUnique({ where: { userId_postId: { userId: user.id, postId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { userId_postId: { userId: user.id, postId } } });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, postId } });
  }
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { slug: true } });
  if (post) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/bookmarks");
}

export async function reportContent(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  const postId = formData.get("postId") ? String(formData.get("postId")) : null;
  const commentId = formData.get("commentId") ? String(formData.get("commentId")) : null;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Reason required");

  await prisma.report.create({
    data: { reporterId: user.id, postId, commentId, reason },
  });

  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { slug: true } });
    if (post) revalidatePath(`/posts/${post.slug}`);
  }
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || null,
      bio: bio || null,
      website: website || null,
      avatarUrl: avatarUrl || null,
    },
  });

  revalidatePath(`/users/${user.username}`);
  redirect("/settings/profile");
}

function requireModerator(user: { role?: string } | null) {
  if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) throw new Error("Forbidden");
}

function requireAdmin(user: { role?: string } | null) {
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
}

export async function banUser(formData: FormData) {
  const user = await getCurrentDbUser();
  requireAdmin(user);
  const userId = String(formData.get("userId"));
  const ban = formData.get("ban") === "true";
  await prisma.user.update({ where: { id: userId }, data: { banned: ban } });
  await prisma.auditLog.create({
    data: { actorId: (user as { id: string }).id, action: ban ? "BAN_USER" : "UNBAN_USER", targetType: "USER", targetId: userId },
  });
  revalidatePath("/admin");
}

export async function resolveReport(formData: FormData) {
  const user = await getCurrentDbUser();
  requireModerator(user);
  const reportId = String(formData.get("reportId"));
  const status = String(formData.get("status") ?? "RESOLVED");
  await prisma.report.update({ where: { id: reportId }, data: { status: status as import("@prisma/client").ReportStatus, resolvedAt: new Date() } });
  revalidatePath("/admin/reports");
}

export async function softDeletePost(formData: FormData) {
  const user = await getCurrentDbUser();
  requireModerator(user);
  const postId = String(formData.get("postId"));
  await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: { actorId: (user as { id: string }).id, action: "SOFT_DELETE_POST", targetType: "POST", targetId: postId },
  });
  revalidatePath("/admin/reports");
  revalidatePath("/");
}

export async function softDeleteComment(formData: FormData) {
  const user = await getCurrentDbUser();
  requireModerator(user);
  const commentId = String(formData.get("commentId"));
  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/reports");
}

export async function setUserRole(formData: FormData) {
  const user = await getCurrentDbUser();
  requireAdmin(user);
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role"));
  await prisma.user.update({ where: { id: userId }, data: { role: role as import("@prisma/client").Role } });
  await prisma.auditLog.create({
    data: { actorId: (user as { id: string }).id, action: "SET_ROLE", targetType: "USER", targetId: userId, metadata: { role } },
  });
  revalidatePath("/admin");
}
