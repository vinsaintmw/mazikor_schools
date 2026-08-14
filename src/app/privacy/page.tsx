import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${APP_NAME} Privacy Policy — how we collect, use and protect your school's data.`,
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "1. Who we are",
    body: `${APP_NAME} ("Mazikor", "we", "our") operates a school management platform that helps schools store and manage student, staff, academic and financial records. This policy explains what we collect, why we collect it and the rights you have over your data.`,
  },
  {
    title: "2. Data we collect",
    body: "When a school subscribes, we collect the school's name, contact details and billing information. When you use the platform, we store the records your school enters — student profiles, attendance, results, fee and payment data — as well as basic account details for staff and parents who access the system.",
  },
  {
    title: "3. How we use data",
    body: "We use your data to provide the school management service, keep the platform secure, improve our product and provide support. We do not sell your data. A school owns the records it enters and controls who can see them through the platform's role-based permissions.",
  },
  {
    title: "4. Data security",
    body: "Records are encrypted in transit and at rest and stored on secure servers with daily backups. Access is limited to staff who need it to operate the service, and we enforce strict role-based access controls on every account.",
  },
  {
    title: "5. Data retention",
    body: "We keep your school's records for as long as your account is active and for a reasonable period afterwards to allow reactivation. You may request deletion of your data at any time, and we will remove or anonymise it in line with applicable law.",
  },
  {
    title: "6. Demo requests",
    body: "If you request a demo, we collect your school name, contact details, student count and message so we can respond to your enquiry. We use these details only for that purpose and never share them with third parties for marketing.",
  },
  {
    title: "7. Cookies",
    body: "We use essential cookies to keep you signed in and to protect your account. We do not use tracking cookies for advertising.",
  },
  {
    title: "8. Your rights",
    body: "You may request a copy of your data, ask us to correct inaccuracies, or ask us to delete your data. To exercise any of these rights, contact us at hello@mazikor.mw.",
  },
  {
    title: "9. Changes to this policy",
    body: "We may update this policy from time to time. Significant changes will be communicated through the platform. Continued use of the service after changes means you accept the updated policy.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
          Questions about this policy? Email{" "}
          <a href="mailto:hello@mazikor.mw" className="font-medium text-foreground underline underline-offset-4">
            hello@mazikor.mw
          </a>
          .
        </div>
      </main>
    </div>
  );
}
