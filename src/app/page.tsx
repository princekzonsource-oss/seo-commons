import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { getCurrentDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home — SEO Community Feed",
  description: "Latest discussions, tips, case studies, and questions from the SEO community.",
  alternates: { canonical: "/" },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; range?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp?.page ?? "1") || 1;
  const sort = (sp?.sort ?? "hot") as "hot" | "top" | "new" | "unanswered";
  const range = (sp?.range ?? "week") as "today" | "week" | "month" | "all";
  const type = sp?.type;
  const currentUser = await getCurrentDbUser();
  const { posts, totalPages, total } = await getPublishedPosts({ page, sort, range, type });

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Latest discussions</h1>
        <p className="text-muted-foreground">
          Practical SEO tips, case studies, and questions from the community.
        </p>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent posts</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(["hot", "top", "new", "unanswered"] as const).map((s) => (
          <Link
            key={s}
            href={`/?sort=${s}${s === "top" ? `&range=${range}` : ""}${type ? `&type=${type}` : ""}`}
            className={
              "rounded-full px-3 py-1 capitalize " +
              (sort === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")
            }
          >
            {s}
          </Link>
        ))}
        {sort === "top" && (
          <div className="ml-2 flex gap-1 text-xs">
            {(["today", "week", "month", "all"] as const).map((r) => (
              <Link
                key={r}
                href={`/?sort=top&range=${r}${type ? `&type=${type}` : ""}`}
                className={
                  "rounded-full px-2 py-0.5 capitalize " +
                  (range === r ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {r}
              </Link>
            ))}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet. Be the first to write one!</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/?page=${page - 1}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} posts)
          </span>
          {page < totalPages && (
            <Link href={`/?page=${page + 1}`}>
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}