import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tags`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.5 },
  ];

  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    for (const p of posts) {
      entries.push({
        url: `${base}/posts/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    const tags = await prisma.tag.findMany({ select: { slug: true } });
    for (const t of tags) {
      entries.push({ url: `${base}/tags/${t.slug}`, changeFrequency: "weekly", priority: 0.5 });
    }
    const users = await prisma.user.findMany({ select: { username: true } });
    for (const u of users) {
      entries.push({ url: `${base}/users/${u.username}`, changeFrequency: "monthly", priority: 0.4 });
    }
  } catch {
    // DB unavailable during build; return static entries
  }

  return entries;
}