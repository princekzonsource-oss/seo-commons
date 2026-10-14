# SEO Commons

An open community platform for SEO professionals — built with Next.js, Prisma, Clerk, and Supabase.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma** + **PostgreSQL** (Supabase)
- **Clerk** Auth
- **Tailwind CSS** + **shadcn/ui**

## Local Setup

1. `git clone https://github.com/princekzonsource-oss/seo-commons.git`
2. `cd seo-commons`
3. `npm install`
4. Copy `.env.example` to `.env.local` and fill in values
5. `npx prisma migrate dev`
6. `npm run dev`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

- **Posts, comments, voting, tags**
- **User profiles and karma**
- **Notifications, bookmarks, follows**
- **Admin moderation**
- **SEO**: SSR, ISR, JSON‑LD, sitemap, RSS

## Community UI

- Dark‑first design with smooth hover states
- Reddit‑style vote column and card layout
- Responsive 3‑column feed (Left/Right sidebars)
- Real‑time updates via Server Actions

## Deployment

The easiest way to deploy to production is via **Vercel** (connect the GitHub repo → auto‑deploy).

For Supabase, use separate production credentials and clear test data before launch.

## Contributing

Feel free to open issues or PRs. See `CONTRIBUTING.md` (optional) for guidelines.

---

Built with ❤️ by the SEO Commons team.