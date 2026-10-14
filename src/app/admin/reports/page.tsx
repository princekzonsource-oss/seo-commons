import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveReport, softDeletePost, softDeleteComment } from "@/lib/mutators";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const me = await getCurrentDbUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: { reporter: { select: { username: true } }, post: { select: { title: true, slug: true, id: true } }, comment: { select: { content: true, id: true, postId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Reports queue</h1>
      {reports.length === 0 && <p className="text-muted-foreground">No open reports.</p>}
      {reports.map((r) => (
        <Card key={r.id}>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">By {r.reporter.username}</p>
            <p><strong>Reason:</strong> {r.reason}</p>
            {r.post && <p><strong>Post:</strong> {r.post.title}</p>}
            {r.comment && <p><strong>Comment:</strong> {r.comment.content}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <form action={resolveReport} className="inline">
                <input type="hidden" name="reportId" value={r.id} />
                <input type="hidden" name="status" value="REVIEWED" />
                <Button size="sm" variant="outline" type="submit">Mark reviewed</Button>
              </form>
              <form action={resolveReport} className="inline">
                <input type="hidden" name="reportId" value={r.id} />
                <input type="hidden" name="status" value="DISMISSED" />
                <Button size="sm" variant="ghost" type="submit">Dismiss</Button>
              </form>
              {r.post && (
                <form action={softDeletePost} className="inline">
                  <input type="hidden" name="postId" value={r.post.id} />
                  <Button size="sm" variant="destructive" type="submit">Soft-delete post</Button>
                </form>
              )}
              {r.comment && (
                <form action={softDeleteComment} className="inline">
                  <input type="hidden" name="commentId" value={r.comment.id} />
                  <Button size="sm" variant="destructive" type="submit">Soft-delete comment</Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}