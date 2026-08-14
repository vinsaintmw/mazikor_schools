import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let school = null;
  if (session.user.schoolId) {
    school = await db.school.findUnique({
      where: { id: session.user.schoolId },
      select: {
        id: true,
        name: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        academicYears: { take: 1, select: { id: true } },
      },
    });
    if (!school) redirect("/login");
    if (school.academicYears.length === 0) redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <AppShell
        session={session}
        school={
          school
            ? {
                name: school.name,
                logo: school.logo,
                primaryColor: school.primaryColor,
                secondaryColor: school.secondaryColor,
              }
            : null
        }
      >
        {children}
      </AppShell>
    </div>
  );
}
