import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp?.q ?? "";
  return {
    title: q ? `Search: ${q}` : "Search",
    description: "Search posts by title and content.",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp?.q ?? "";
  const page = Number(sp?.page ?? "1") || 1;
  const { posts, total, totalPages } = q
    ? await getPublishedPosts({ page, search: q })
    : { posts: [], total: 0, totalPages: 0 };

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Search</h1>
      <form action="/search" method="get" className="mb-6 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search posts..." />
        <Button type="submit">Search</Button>
      </form>
      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          {total} result{total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      {q && posts.length === 0 && (
        <p className="text-muted-foreground">No results found.</p>
      )}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}>
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}