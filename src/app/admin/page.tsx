import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { banUser, setUserRole } from "@/lib/mutators";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const me = await getCurrentDbUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "MODERATOR")) redirect("/");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const reportsOpen = await prisma.report.count({ where: { status: "OPEN" } });

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/admin/reports" className="text-primary hover:underline">
          Reports queue ({reportsOpen})
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Username</th>
                <th className="p-2">Role</th>
                <th className="p-2">Reputation</th>
                <th className="p-2">Banned</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.reputation}</td>
                  <td className="p-2">{u.banned ? "Yes" : "No"}</td>
                  <td className="p-2 space-x-2">
                    {me.role === "ADMIN" && (
                      <form action={setUserRole} className="inline">
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="role" defaultValue={u.role} className="rounded border px-2 py-1 text-xs">
                          <option value="USER">USER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <Button size="sm" variant="outline" type="submit" className="ml-1">
                          Set
                        </Button>
                      </form>
                    )}
                    {me.role === "ADMIN" && u.id !== me.id && (
                      <form action={banUser} className="inline">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="ban" value={u.banned ? "false" : "true"} />
                        <Button size="sm" variant="destructive" type="submit">
                          {u.banned ? "Unban" : "Ban"}
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}