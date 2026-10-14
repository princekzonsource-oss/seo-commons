"use server";

import { redirect } from "next/navigation";
import slugify from "slugify";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(10),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional(),
  type: z.enum(["QUESTION", "DISCUSSION", "CASE_STUDY", "RESOURCE"]).optional(),
});

export async function createPost(formData: FormData) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = schema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    coverImage: formData.get("coverImage"),
    tags: formData.get("tags"),
    type: formData.get("type"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { title, content, coverImage, tags } = parsed.data;
  const baseSlug = slugify(title, { lower: true, strict: true });
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const excerpt = content.slice(0, 100).replace(/\n/g, " ");

  const tagNames = (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      coverImage: coverImage || null,
      type: (parsed.data.type ?? "DISCUSSION") as import("@prisma/client").PostType,
      authorId: user.id,
      tags: {
        connectOrCreate: tagNames.map((name) => {
          const s = slugify(name, { lower: true, strict: true });
          return {
            where: { slug: s },
            create: { name, slug: s },
          };
        }),
      },
    },
  });

  redirect(`/posts/${post.slug}`);
}