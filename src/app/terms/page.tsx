import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of SEO Commons.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert space-y-4">
          <p>By using SEO Commons, you agree to these terms.</p>
          <p>
            You are responsible for the content you post. Do not spam, harass others, or
            post unlawful or infringing material.
          </p>
          <p>
            We reserve the right to remove content that violates our guidelines and to
            suspend accounts when necessary.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}