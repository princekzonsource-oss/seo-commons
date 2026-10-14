/* eslint-disable @typescript-eslint/no-explicit-any */
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function usernameFromEvent(data: any): string {
  if (data.username) return data.username;
  const email: string = data.email_addresses?.[0]?.email_address ?? "";
  const base = email.split("@")[0]?.replace(/[^a-z0-9_]/gi, "") || "user";
  return `${base}_${data.id.slice(-6)}`;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response("Missing webhook secret", { status: 500 });

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);
  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data as any;
    const email = data.email_addresses?.[0]?.email_address ?? "";
    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: {
        email,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null,
        avatarUrl: data.image_url ?? null,
      },
      create: {
        clerkId: data.id,
        username: usernameFromEvent(data),
        email,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null,
        avatarUrl: data.image_url ?? null,
      },
    });
  }

  if (event.type === "user.deleted") {
    const data = event.data as any;
    await prisma.user.delete({ where: { clerkId: data.id } }).catch(() => {});
  }

  return Response.json({ received: true });
}