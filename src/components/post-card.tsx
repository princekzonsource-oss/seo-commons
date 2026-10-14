import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowBigDown, ArrowBigUp, Bookmark, FileText, HelpCircle, Link2, MessageCircle, MessageSquare } from "lucide-react";
import { toggleBookmark, votePost } from "@/lib/mutators";
import { getCurrentDbUser } from "@/lib/auth";
import { getVoteScore } from "@/lib/posts";
import { getTagColor } from "@/lib/tag-colors";
import { ShareButton } from "@/components/share-button";
import type { Prisma } from "@prisma/client";

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: { select: { id: true; username: true; name: true; avatarUrl: true; reputation: true } };
    tags: { select: { id: true; name: true; slug: true; color: true } };
    votes: { select: { value: true; userId: true } };
    _count: { select: { comments: true } };
  };
}>;

const typeIcon: Record<string, typeof HelpCircle> = {
  QUESTION: HelpCircle,
  DISCUSSION: MessageCircle,
  CASE_STUDY: FileText,
  RESOURCE: Link2,
};

export async function PostCard({ post }: { post: PostWithRelations }) {
  const me = await getCurrentDbUser();
  const userVote = me ? (post.votes.find((v) => v.userId === me.id)?.value ?? 0) : 0;
  const score = getVoteScore(post.votes);
  const TypeIcon = typeIcon[post.type] ?? MessageCircle;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <Card className="overflow-hidden border border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex gap-4 p-4">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1 pt-1">
          <form action={votePost}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="value" value="1" />
            <button
              type="submit"
              className={
                "rounded-md p-1 transition-all hover:scale-110 " +
                (userVote === 1 ? "text-[#ff4500]" : "text-muted-foreground hover:text-foreground")
              }
            >
              <ArrowBigUp className="h-6 w-6" fill={userVote === 1 ? "#ff4500" : "none"} />
            </button>
          </form>
          <span
            className={
              "text-sm font-bold " +
              (score > 0 ? "text-[#ff4500]" : score < 0 ? "text-[#7193ff]" : "text-muted-foreground")
            }
          >
            {score}
          </span>
          <form action={votePost}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="value" value="-1" />
            <button
              type="submit"
              className={
                "rounded-md p-1 transition-all hover:scale-110 " +
                (userVote === -1 ? "text-[#7193ff]" : "text-muted-foreground hover:text-foreground")
              }
            >
              <ArrowBigDown className="h-6 w-6" fill={userVote === -1 ? "#7193ff" : "none"} />
            </button>
          </form>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Link href={`/users/${post.author.username}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.username} />
                <AvatarFallback>{post.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 text-xs text-muted-foreground">
              <Link href={`/users/${post.author.username}`} className="font-medium text-foreground hover:underline">
                {post.author.name ?? post.author.username}
              </Link>
              <div className="flex items-center gap-2">
                <span>· {post.author.reputation} karma</span>
                <span>·</span>
                <time dateTime={post.createdAt.toISOString()}>
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
              <TypeIcon className="h-3.5 w-3.5" />
              {post.type.replace("_", " ")}
            </span>
          </div>

          <h2 className="text-2xl font-bold leading-tight tracking-tight">
            <Link href={`/posts/${post.slug}`} className="hover:text-primary">
              {post.title}
            </Link>
          </h2>

          {post.excerpt && <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>}

          {post.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-56 w-full rounded-lg border object-cover transition-transform duration-300 hover:scale-[1.01]"
              loading="lazy"
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => {
              const c = getTagColor(tag.slug);
              return (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-transform hover:scale-105"
                    style={{ color: c.color, backgroundColor: c.background }}
                  >
                    {tag.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
            <Link href={`/posts/${post.slug}`} className="inline-flex items-center gap-2 hover:text-foreground">
              <MessageSquare className="h-4 w-4" />
              {post._count.comments}
            </Link>
            <ShareButton url={`${siteUrl}/posts/${post.slug}`} title={post.title} />
            {me && (
              <form action={toggleBookmark}>
                <input type="hidden" name="postId" value={post.id} />
                <button type="submit" className="inline-flex items-center gap-2 hover:text-foreground">
                  <Bookmark className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}