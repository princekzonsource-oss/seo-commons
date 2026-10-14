import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description: "About SEO Commons, the community for SEO professionals.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">About SEO Commons</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert">
          <p>
            SEO Commons is an open community where SEO professionals, marketers, and
            builders share insights, ask questions, and learn together. From technical
            SEO and Core Web Vitals to content strategy and link building, this is a
            place to discuss what actually works.
          </p>
          <p>
            The platform is built with Next.js and optimized for search so that great
            discussions are discoverable for everyone, forever.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}