import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { Bookmark, Compass, Hash, Home, LayoutDashboard, Tag, User } from "lucide-react";

export async function LeftSidebar() {
  const me = await getCurrentDbUser();
  const communities = await prisma.tag.findMany({
    orderBy: { posts: { _count: "desc" } },
    take: 6,
    select: { name: true, slug: true },
  });

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tags", label: "Tags", icon: Tag },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/search", label: "Search", icon: Compass },
    { href: me ? `/users/${me.username}` : "/sign-in", label: "Profile", icon: User },
  ];

  return (
    <aside className="sticky top-20 space-y-2 rounded-xl border bg-card p-3 text-sm shadow-sm">
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t pt-2">
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your communities
        </p>
        {communities.map((c) => (
          <Link
            key={c.slug}
            href={`/tags/${c.slug}`}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Hash className="h-4 w-4" />
            {c.name}
          </Link>
        ))}
      </div>

      {me && (me.role === "ADMIN" || me.role === "MODERATOR") && (
        <div className="pt-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </Link>
        </div>
      )}
      {me && (
        <div className="border-t pt-2">
          <Link href="/posts/new" className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:opacity-90">
            Create post
          </Link>
        </div>
      )}
      <div className="border-t pt-2 text-xs text-muted-foreground">
        SEO Commons · {me ? `@${me.username}` : "Guest"}
      </div>
    </aside>
  );
}