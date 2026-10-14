import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default async function BookmarksPage() {
  const me = await getCurrentDbUser();
  if (!me) redirect("/sign-in");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: me.id },
    include: {
      post: {
        include: {
          author: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } },
          tags: { select: { id: true, name: true, slug: true, color: true } },
          votes: { select: { value: true, userId: true } },
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const posts = bookmarks.map((b) => b.post).filter((p) => p && !p.deletedAt);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Bookmarks</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No bookmarks yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post as never} currentUser={me} />
          ))}
        </div>
      )}
    </section>
  );
}