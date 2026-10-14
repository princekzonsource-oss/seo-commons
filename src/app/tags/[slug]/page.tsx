import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { getCurrentDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return { title: "Tag not found" };
  return {
    title: `#${tag.name}`,
    description: tag.description ?? `Posts tagged ${tag.name}.`,
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp?.page ?? "1") || 1;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) notFound();
  const currentUser = await getCurrentDbUser();
  const { posts, total, totalPages } = await getPublishedPosts({ page, tagSlug: slug });

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">#{tag.name}</h1>
      {tag.description && <p className="mb-6 text-muted-foreground">{tag.description}</p>}
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts for this tag yet.</p>
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
            <Link href={`/tags/${slug}?page=${page - 1}`}>
              <Button variant="outline">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} posts)
          </span>
          {page < totalPages && (
            <Link href={`/tags/${slug}?page=${page + 1}`}>
              <Button variant="outline">Next</Button>
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}