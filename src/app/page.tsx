import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LandingPage } from "@/components/landing/landing-page";
import type { LandingPlan } from "@/components/landing/pricing";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_TAGLINE,
  description:
    "Mazikor Schools brings students, teachers, attendance, academics, fees and school administration into one powerful platform. Smart School Management, Made Simple.",
  keywords: [
    "school management software",
    "school management system",
    "student management",
    "attendance tracking",
    "school fees management",
    "academic results",
    "parent portal",
    "Malawi schools",
    "Mazikor Schools",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Students, teachers, attendance, academics, fees and school administration — one powerful platform.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Students, teachers, attendance, academics, fees and school administration — one powerful platform.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: APP_NAME,
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://schools.mazikor.com",
      logo: "/logo.png",
      slogan: APP_TAGLINE,
      description:
        "Mazikor Schools is a school management platform covering students, teachers, attendance, academics, fees and school administration.",
    },
    {
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Smart school management for students, teachers, attendance, academics, fees and administration.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "MWK",
      },
      featureList:
        "Student management, Attendance tracking, Academic results and report cards, Fees and payment management, Parent portal, School reports",
    },
  ],
};

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const plans = await fetchPlans();

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage plans={plans} />
    </>
  );
}

async function fetchPlans(): Promise<LandingPlan[]> {
  try {
    const rows = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceMonthly: Number(p.priceMonthly),
      priceYearly: Number(p.priceYearly),
      maxStudents: p.maxStudents,
      maxTeachers: p.maxTeachers,
      maxStaff: p.maxStaff,
      maxAdmins: p.maxAdmins,
      maxStorageGB: p.maxStorageGB,
    }));
  } catch (error) {
    console.error("Failed to load pricing plans:", error);
    return [];
  }
}
