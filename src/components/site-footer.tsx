import Link from "next/link";

const columns = [
  {
    title: "Community",
    links: [
      { href: "/", label: "Home" },
      { href: "/tags", label: "Tags" },
      { href: "/search", label: "Search" },
      { href: "/posts/new", label: "Create post" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/about", label: "About" },
      { href: "/guidelines", label: "Guidelines" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/bookmarks", label: "Bookmarks" },
      { href: "/notifications", label: "Notifications" },
      { href: "/settings/profile", label: "Settings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <p className="font-semibold">SEO Commons</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A community for SEO professionals to share, ask, and learn.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} SEO Commons
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}