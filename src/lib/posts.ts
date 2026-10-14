import { prisma } from "@/lib/prisma";

export const POSTS_PER_PAGE = 10;

export async function getPublishedPosts(params: {
  page?: number;
  perPage?: number;
  tagSlug?: string;
  search?: string;
  sort?: "hot" | "top" | "new" | "unanswered";
  range?: "today" | "week" | "month" | "all";
  type?: string;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.perPage ?? POSTS_PER_PAGE;
  const sort = params.sort ?? "hot";
  const range = params.range ?? "week";

  const now = new Date();
  const cutoff =
    range === "today"
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : range === "week"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : range === "month"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const where: import("@prisma/client").Prisma.PostWhereInput = { published: true, deletedAt: null };
  if (params.tagSlug) where.tags = { some: { slug: params.tagSlug } };
  if (params.type) where.type = params.type as import("@prisma/client").PostType;
  if (sort === "unanswered") where.comments = { none: {} };
  if (sort === "top" && cutoff) where.createdAt = { gte: cutoff };
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { content: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "new" || sort === "unanswered"
      ? { createdAt: "desc" as const }
      : { createdAt: "desc" as const };

  // Sequential queries to avoid connection pool exhaustion (connection_limit=1)
  const posts = await prisma.post.findMany({
    where,
    orderBy,
    include: {
      author: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } },
      tags: { select: { id: true, name: true, slug: true, color: true } },
      votes: { select: { value: true, userId: true } },
      _count: { select: { comments: true } },
    },
  });
  const totalCount = await prisma.post.count({ where });

  let sorted = posts;
  if (sort === "top") {
    sorted = [...posts].sort((a, b) => getVoteScore(b.votes) - getVoteScore(a.votes));
  } else if (sort === "hot") {
    sorted = [...posts].sort((a, b) => {
      const ha = getVoteScore(a.votes) / Math.pow((Date.now() - a.createdAt.getTime()) / 3600000 + 2, 1.5);
      const hb = getVoteScore(b.votes) / Math.pow((Date.now() - b.createdAt.getTime()) / 3600000 + 2, 1.5);
      return hb - ha;
    });
  }

  const skip = (page - 1) * perPage;
  const paged = sorted.slice(skip, skip + perPage);
  return { posts: paged, total: totalCount, page, perPage, totalPages: Math.ceil(totalCount / perPage) };
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, username: true, name: true, avatarUrl: true, bio: true, reputation: true } },
      tags: { select: { id: true, name: true, slug: true, color: true } },
      votes: { select: { value: true, userId: true } },
      comments: {
        where: { parentId: null },
        orderBy: [{ isAccepted: "desc" }, { createdAt: "asc" }],
        include: {
          author: { select: { id: true, username: true, name: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, username: true, name: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });
}

export function getVoteScore(votes: { value: number }[]): number {
  return votes.reduce((acc, v) => acc + v.value, 0);
}
