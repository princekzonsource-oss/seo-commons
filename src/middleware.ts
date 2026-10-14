import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/posts/(.*)",
  "/tags(.*)",
  "/users/(.*)",
  "/search(.*)",
  "/about(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/guidelines(.*)",
  "/settings(.*)",
  "/notifications(.*)",
  "/bookmarks(.*)",
  "/admin(.*)",
  "/about(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/posts(.*)",
  "/api/tags(.*)",
  "/api/users/(.*)",
  "/api/search(.*)",
  "/sitemap.xml",
  "/robots.txt",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export function headers() {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-XSS-Protection", value: "1; mode=block" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; style-src 'self';" },
    { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  ];
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};