import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { createPost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New post",
  description: "Create a new post.",
};

export default async function NewPostPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create new post</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea id="content" name="content" rows={12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover image URL</Label>
              <Input id="coverImage" name="coverImage" type="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Post type</Label>
              <select
                id="type"
                name="type"
                defaultValue="DISCUSSION"
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
              <Input id="tags" name="tags" placeholder="seo, technical-seo" />
            </div>
            <Button type="submit">Publish</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}