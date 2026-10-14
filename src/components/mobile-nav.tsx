"use client";

import Link from "next/link";
import { Home, Bell, PenSquare, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/posts/new", label: "Create", icon: PenSquare },
  { href: "/notifications", label: "Inbox", icon: Bell },
  { href: "/settings/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={
              "flex flex-col items-center gap-1 px-2 text-xs " +
              (pathname === href ? "text-primary" : "text-muted-foreground")
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}