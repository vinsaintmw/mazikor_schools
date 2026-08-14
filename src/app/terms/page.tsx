import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `${APP_NAME} Terms of Service — the agreement that governs use of the platform.`,
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: `By creating a school account or using ${APP_NAME}, you agree to these Terms of Service. If you are using the platform on behalf of a school, you confirm that you are authorised to accept these terms on the school's behalf.`,
  },
  {
    title: "2. The service",
    body: "Mazikor Schools provides a web-based school management platform covering student records, attendance, academic results, fee management, communication and reporting. We aim to keep the service available around the clock, but we may schedule maintenance windows and do not guarantee uninterrupted availability.",
  },
  {
    title: "3. Accounts and responsibilities",
    body: "You are responsible for safeguarding login credentials and for all activity under your accounts. A school must ensure it holds the lawful consent required to store data about its students, parents and staff, and must configure permissions appropriately.",
  },
  {
    title: "4. Acceptable use",
    body: "You agree not to misuse the service — including attempting to access other schools' data, reverse-engineering the platform, transmitting malware, or using the platform to store unlawful material.",
  },
  {
    title: "5. Plans and payment",
    body: "Pricing is set out on the public pricing page and reflects the plan limits on students, staff, storage and features. Fees are billed monthly or annually as selected. You can upgrade, downgrade or cancel at any time; cancellations take effect at the end of the current billing period and we do not provide refunds for partial periods.",
  },
  {
    title: "6. Trial period",
    body: "New schools can use a free trial without payment details. If the trial is not converted to a paid plan, access to the platform will be suspended after the trial ends.",
  },
  {
    title: "7. Data ownership and backups",
    body: "All records a school enters remain the school's property. We store data securely and maintain daily backups, but you are encouraged to keep your own copies of critical records. We are not liable for data loss caused by circumstances beyond our reasonable control.",
  },
  {
    title: "8. Intellectual property",
    body: "The platform, including its design, code, logos and documentation, is owned by Mazikor and protected by applicable law. This agreement does not grant you any rights to the platform's intellectual property beyond using the service.",
  },
  {
    title: "9. Limitation of liability",
    body: "The service is provided \"as is\". To the maximum extent permitted by law, we are not liable for indirect or consequential loss, or for loss of data or profits, arising from your use of the platform.",
  },
  {
    title: "10. Termination",
    body: "Either party may end this agreement on written notice. We may suspend or terminate access for serious or repeated breaches of these terms, with notice where practical.",
  },
  {
    title: "11. Changes to these terms",
    body: "We may update these terms as the service evolves. Material changes will be communicated through the platform, and continued use of the service after changes means you accept the updated terms.",
  },
  {
    title: "12. Contact",
    body: "Questions about these terms? Email hello@mazikor.mw.",
  },
];

export default function TermsPage() {
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
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
