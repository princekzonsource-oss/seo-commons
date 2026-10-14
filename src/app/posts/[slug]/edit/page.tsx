import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { updatePost, deletePost } from "@/lib/mutators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { tags: true },
  });
  if (!post || post.authorId !== user.id) notFound();

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit post</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePost} className="space-y-4">
            <input type="hidden" name="postId" value={post.id} />
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={post.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea id="content" name="content" rows={12} defaultValue={post.content} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover image URL</Label>
              <Input id="coverImage" name="coverImage" type="url" defaultValue={post.coverImage ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Post type</Label>
              <select
                id="type"
                name="type"
                defaultValue={post.type ?? "DISCUSSION"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="DISCUSSION">Discussion</option>
                <option value="QUESTION">Question</option>
                <option value="CASE_STUDY">Case Study</option>
                <option value="RESOURCE">Resource</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" defaultValue={post.tags.map((t) => t.name).join(", ")} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
            </div>
          </form>
          <form action={deletePost} className="mt-4">
            <input type="hidden" name="postId" value={post.id} />
            <Button type="submit" variant="destructive">Delete post</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

