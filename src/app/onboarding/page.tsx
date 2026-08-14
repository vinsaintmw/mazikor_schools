import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_NAME } from "@/lib/constants";
import { SetupWizard } from "@/components/setup/setup-wizard";

export const metadata: Metadata = {
  title: "Set up your school",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.schoolId) redirect("/admin");

  const school = await db.school.findUnique({
    where: { id: session.user.schoolId },
    include: { academicYears: { take: 1, select: { id: true } } },
  });
  if (!school) redirect("/login");
  if (school.academicYears.length) redirect("/dashboard");

  const profile = {
    motto: school.motto,
    address: school.address,
    phone: school.phone,
    email: school.email,
    website: school.website,
    registrationNumber: school.registrationNumber,
    currency: school.currency,
    currencySymbol: school.currencySymbol,
    logo: school.logo,
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl">
          <Image
            src="/logo.png"
            alt={`${APP_NAME} logo`}
            width={1024}
            height={1024}
            className="size-12 object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome, {session.user.name ?? school.name}!
        </h1>
        <p className="text-sm text-muted-foreground">
          A few quick steps to set up {school.name}. You can change everything later in Settings.
        </p>
      </div>
      <SetupWizard schoolName={school.name} school={profile} />
    </div>
  );
}
