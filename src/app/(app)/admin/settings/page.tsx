import { redirect } from "next/navigation";
import { SettingsIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");

  const rows = [
    ["Platform name", APP_NAME],
    ["Environment", process.env.NODE_ENV === "production" ? "Production" : "Development"],
    ["Authentication", "Email & password (Credentials)"],
    ["Database", "PostgreSQL via Prisma"],
    ["Demo mode", process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "Enabled" : "Disabled"],
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Platform settings" description="Configuration for the Mazikor Schools platform" />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="size-4" />
            Platform
          </CardTitle>
          <CardDescription>Read-only overview of platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="divide-y">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
