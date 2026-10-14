import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { title: true, slug: true, excerpt: true, content: true, createdAt: true, author: { select: { username: true } } },
  });

  const items = posts
    .map(
      (p) => `<item>
  <title><![CDATA[${p.title}]]></title>
  <link>${base}/posts/${p.slug}</link>
  <guid>${base}/posts/${p.slug}</guid>
  <pubDate>${p.createdAt.toUTCString()}</pubDate>
  <description><![CDATA[${p.excerpt ?? p.content.slice(0, 200)}]]></description>
  <author>${p.author.username}</author>
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>SEO Commons</title>
    <link>${base}</link>
    <description>Latest posts from SEO Commons</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}