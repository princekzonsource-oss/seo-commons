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

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};