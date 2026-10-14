import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { toggleFollow } from "@/lib/mutators";
import { PostCard } from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { title: "User not found" };
  return {
    title: user.name ?? user.username,
    description: user.bio ?? `Posts by ${user.username}`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: { select: { followers: true, following: true } },
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, name: true, avatarUrl: true, reputation: true } },
          tags: { select: { id: true, name: true, slug: true, color: true } },
          votes: { select: { value: true, userId: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });
  if (!user) notFound();

  const me = await getCurrentDbUser();
  const isFollowing =
    me && me.id !== user.id
      ? !!(await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: me.id, followingId: user.id } },
        }))
      : false;

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.name ?? user.username}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
          {user.website && (
            <a href={user.website} className="mt-1 block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
              {user.website}
            </a>
          )}
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{user._count.followers}</strong> followers</span>
            <span><strong className="text-foreground">{user._count.following}</strong> following</span>
            <span><strong className="text-foreground">{user.reputation}</strong> karma</span>
          </div>
          {me && me.id !== user.id && (
            <form action={toggleFollow} className="mt-3">
              <input type="hidden" name="followingId" value={user.id} />
              <Button size="sm" variant={isFollowing ? "outline" : "default"} type="submit">
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </form>
          )}
        </div>
      </div>
      <h2 className="mb-4 text-xl font-semibold">Posts</h2>
      {user.posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {user.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}