import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "How to participate in SEO Commons.",
};

export default function GuidelinesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Community Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert space-y-4">
          <ul>
            <li>Be respectful and constructive.</li>
            <li>Share real experiences and evidence when possible.</li>
            <li>Stay on topic and use relevant tags.</li>
            <li>No spam, self-promotion spam, or duplicate posts.</li>
            <li>Report problematic content to moderators.</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}