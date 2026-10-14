/* eslint-disable react-hooks/purity */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVoteScore } from "@/lib/posts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function RightSidebar() {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const recent = await prisma.post.findMany({
    where: { published: true, deletedAt: null, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      author: { select: { username: true, name: true, avatarUrl: true } },
      votes: { select: { value: true } },
      _count: { select: { comments: true } },
    },
  });

  const trending = [...recent]
    .sort((a, b) => (getVoteScore(b.votes) + b._count.comments * 0.5) - (getVoteScore(a.votes) + a._count.comments * 0.5))
    .slice(0, 5);

  const topUsers = await prisma.user.findMany({
    orderBy: { reputation: "desc" },
    take: 5,
    select: { username: true, name: true, avatarUrl: true, reputation: true },
  });

  // Sequential queries to avoid connection pool exhaustion (connection_limit=1)
  const members = await prisma.user.count();
  const postsToday = await prisma.post.count({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, deletedAt: null },
  });
  const activeToday = await prisma.user.count({
    where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  const popularTags = await prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { posts: { _count: "desc" } },
    take: 8,
  });

  return (
    <aside className="sticky top-20 space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">About Community</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>A place for SEO professionals to share, ask, and learn.</p>
          <div className="flex justify-between">
            <span>{members} members</span>
            <span>{postsToday} posts today</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Trending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trending.length === 0 && <p className="text-xs text-muted-foreground">No trending posts yet.</p>}
          {trending.map((p, i) => (
            <Link key={p.id} href={`/posts/${p.slug}`} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-muted text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
              )}
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ▲ {getVoteScore(p.votes)} · {p._count.comments} comments
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top contributors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topUsers.length === 0 && <p className="text-xs text-muted-foreground">No contributors yet.</p>}
          {topUsers.map((u) => (
            <Link key={u.username} href={`/users/${u.username}`} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
              <Avatar className="h-12 w-12">
                <AvatarImage src={u.avatarUrl ?? undefined} alt={u.username} />
                <AvatarFallback className="text-sm">{u.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{u.name ?? u.username}</p>
                <span className="inline-flex rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-500">
                  {u.reputation} karma
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Community stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold">{members}</p>
            <p className="text-xs text-muted-foreground">members</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold">{postsToday}</p>
            <p className="text-xs text-muted-foreground">posts today</p>
          </div>
          <div className="col-span-2 flex flex-col items-center gap-1">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </span>
            <p className="text-lg font-bold">{activeToday}</p>
            <p className="text-xs text-muted-foreground">active (24h)</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Popular tags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {popularTags.map((t) => (
            <Link key={t.id} href={`/tags/${t.slug}`}>
              <Badge variant="secondary" className="text-xs" style={t.color ? { borderColor: t.color, color: t.color } : undefined}>
                {t.name} ({t._count.posts})
              </Badge>
            </Link>
          ))}
          {popularTags.length === 0 && <p className="text-xs text-muted-foreground">No tags yet.</p>}
        </CardContent>
      </Card>
    </aside>
  );
}