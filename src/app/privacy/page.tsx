import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SEO Commons collects and uses data.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert space-y-4">
          <p>We collect the information you provide when creating an account and posting content.</p>
          <p>
            Your profile, posts, and comments are public. Do not share sensitive personal
            information in public posts.
          </p>
          <p>
            We may use cookies and similar technologies to keep you signed in and improve
            the experience. For questions, contact the site owner.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}