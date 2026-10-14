import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SEO Commons - The SEO Community Platform",
    template: "%s | SEO Commons",
  },
  description:
    "A community platform where SEO professionals share tips, ask questions, post case studies, and discuss technical SEO topics.",
  openGraph: {
    type: "website",
    siteName: "SEO Commons",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ThemeProvider>
            <SiteHeader />
            <div className="mx-auto w-full max-w-7xl flex-1 gap-6 px-4 py-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_300px]">
                <div className="hidden lg:block">
                  <LeftSidebar />
                </div>
                <main className="min-w-0 pb-20 md:pb-0">{children}</main>
                <div className="hidden xl:block">
                  <RightSidebar />
                </div>
              </div>
            </div>
            <MobileNav />
            <SiteFooter />
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
