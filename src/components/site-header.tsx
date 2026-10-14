import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentDbUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const me = await getCurrentDbUser();
  const unread = me ? await getUnreadCount(me.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <svg viewBox="0 0 32 32" className="h-8 w-8 text-primary" aria-hidden="true">
            <path d="M4 24 L10 8 L16 18 L22 8 L28 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">SEO Commons</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              Communities <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Browse by type</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/">All posts</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/?type=QUESTION">Questions</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/?type=DISCUSSION">Discussions</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/?type=CASE_STUDY">Case studies</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/tags">Tag communities</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <form action="/search" method="get" className="hidden flex-1 md:flex">
          <Input name="q" placeholder="Search posts..." className="h-9 max-w-xl" aria-label="Search posts" />
        </form>

        <nav className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/posts/new">
              <Button size="sm" className="bg-orange-500 text-white hover:bg-orange-600">
                New Post
              </Button>
            </Link>
            <Link href="/notifications" className="relative text-sm text-muted-foreground hover:text-foreground">
              Inbox
              {unread > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
            {me && (me.role === "ADMIN" || me.role === "MODERATOR") && (
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            )}
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8" },
              }}
            />
          </Show>
        </nav>
      </div>
    </header>
  );
}