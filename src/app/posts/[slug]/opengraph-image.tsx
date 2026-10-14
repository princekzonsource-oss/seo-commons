import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const alt = "SEO Commons post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, type: true, author: { select: { username: true } } },
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, opacity: 0.8 }}>{post?.type ?? "DISCUSSION"}</div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{post?.title ?? "SEO Commons"}</div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.8 }}>by @{post?.author.username ?? "community"}</div>
      </div>
    ),
    size,
  );
}