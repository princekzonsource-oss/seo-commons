import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPostBySlug, getVoteScore } from "@/lib/posts";
import { getCurrentDbUser } from "@/lib/auth";
import { addComment, deleteComment, votePost, acceptAnswer, reportContent, toggleBookmark } from "@/lib/mutators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt ?? post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt ?? post.content.slice(0, 160),
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author.name ?? post.author.username],
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? post.content.slice(0, 160),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    alternates: { canonical: `/posts/${post.slug}` },
  };
}

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { slug: true },
    });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const me = await getCurrentDbUser();
  const score = getVoteScore(post.votes);
  const userVote = me ? (post.votes.find((v) => v.userId === me.id)?.value ?? 0) : 0;

  const primaryType =
    post.type === "QUESTION"
      ? "QAPage"
      : post.type === "DISCUSSION"
      ? "DiscussionForumPosting"
      : "Article";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": primaryType,
    headline: post.title,
    description: post.excerpt ?? post.content.slice(0, 160),
    author: {
      "@type": "Person",
      name: post.author.name ?? post.author.username,
    },
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    image: post.coverImage ?? undefined,
  };

  const acceptedComment = post.type === "QUESTION" ? post.comments.find((c) => c.isAccepted) : null;
  if (acceptedComment) {
    jsonLd.acceptedAnswer = {
      "@type": "Answer",
      text: acceptedComment.content,
      author: { "@type": "Person", name: acceptedComment.author?.name ?? acceptedComment.author?.username },
    };
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000" },
      { "@type": "ListItem", position: 2, name: post.title, item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/posts/${post.slug}` },
    ],
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          {me && me.id === post.authorId && (
            <a href={`/posts/${post.slug}/edit`} className="text-sm text-primary hover:underline">
              Edit
            </a>
          )}
          {me && me.id !== post.authorId && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Report</summary>
              <form action={reportContent} className="mt-2 space-y-2">
                <input type="hidden" name="postId" value={post.id} />
                <input name="reason" placeholder="Reason" className="w-full rounded border px-2 py-1 text-sm" required />
                <button type="submit" className="text-xs text-destructive hover:underline">Submit</button>
              </form>
            </details>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a href={`/users/${post.author.username}`} className="hover:underline">
            {post.author.name ?? post.author.username}
          </a>
          <span>â€¢</span>
          <time dateTime={post.createdAt.toISOString()}>
            {new Date(post.createdAt).toLocaleDateString()}
          </time>
          <span>â€¢</span>
          <span>ðŸ’¬ {post.comments.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{post.type.replace("_", " ")}</Badge>
          {post.tags.map((tag) => (
            <a key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge variant="secondary">{tag.name}</Badge>
            </a>
          ))}
        </div>
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="mt-4 w-full rounded-lg object-cover"
          />
        )}
        <div className="flex items-center gap-2 pt-2">
          <form action={votePost}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="value" value="1" />
            <Button type="submit" size="sm" variant={userVote === 1 ? "default" : "outline"}>
              â–²
            </Button>
          </form>
          <span className="font-medium">{score}</span>
          <form action={votePost}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="value" value="-1" />
            <Button type="submit" size="sm" variant={userVote === -1 ? "default" : "outline"}>
              â–¼
            </Button>
          </form>
        </div>
        {me && (
          <form action={toggleBookmark} className="mt-2">
            <input type="hidden" name="postId" value={post.id} />
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">
              ðŸ”– Bookmark / Unbookmark
            </button>
          </form>
        )}
      </header>

      <div className="mt-8 space-y-3 text-base leading-7">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">Comments ({post.comments.length})</h2>
        {me ? (
          <form action={addComment} className="mb-6 space-y-2">
            <input type="hidden" name="postId" value={post.id} />
            <Textarea name="content" placeholder="Add a comment..." required rows={3} />
            <Button type="submit" size="sm">
              Comment
            </Button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to comment.
          </p>
        )}

        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-6">
            {post.comments.map((c) => (
              <li key={c.id} className="border-l-2 pl-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <a href={`/users/${c.author.username}`} className="hover:underline">
                      {c.author.name ?? c.author.username}
                    </a>
                    <span>â€¢</span>
                    <time dateTime={c.createdAt.toISOString()}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  {c.isAccepted && (
                    <Badge variant="default" className="text-xs">
                      Accepted
                    </Badge>
                  )}
                  {me && me.id === post.authorId && post.type === "QUESTION" && !c.isAccepted && (
                    <form action={acceptAnswer}>
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="commentId" value={c.id} />
                      <button type="submit" className="text-xs text-primary hover:underline">
                        Accept
                      </button>
                    </form>
                  )}
                  {me && me.id === c.authorId && (
                    <form action={deleteComment}>
                      <input type="hidden" name="commentId" value={c.id} />
                      <button type="submit" className="text-xs text-destructive hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>

                {me && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">Reply</summary>
                    <form action={addComment} className="mt-2 space-y-2">
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="parentId" value={c.id} />
                      <Textarea name="content" placeholder="Write a reply..." required rows={2} />
                      <Button type="submit" size="sm" variant="outline">
                        Reply
                      </Button>
                    </form>
                  </details>
                )}

                {c.replies.length > 0 && (
                  <details className="mt-3 pl-4">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      {c.replies.length} {c.replies.length === 1 ? "reply" : "replies"}
                    </summary>
                    <ul className="mt-2 space-y-3 pl-2">
                      {c.replies.map((r) => (
                      <li key={r.id} className="border-l pl-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <a href={`/users/${r.author.username}`} className="hover:underline">
                              {r.author.name ?? r.author.username}
                            </a>
                            <span>â€¢</span>
                            <time dateTime={r.createdAt.toISOString()}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                          {me && me.id === r.authorId && (
                            <form action={deleteComment}>
                              <input type="hidden" name="commentId" value={r.id} />
                              <button type="submit" className="text-xs text-destructive hover:underline">
                                Delete
                              </button>
                            </form>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{r.content}</p>
                      </li>
                    ))}
                  </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
