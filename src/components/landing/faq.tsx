import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    question: "What does Mazikor Schools actually do?",
    answer:
      "It is an all-in-one school management platform for students, teachers, attendance, exams and results, fees and payments, notices, and reporting. Instead of juggling paper registers, spreadsheets and separate apps, your whole school runs in one secure system.",
  },
  {
    question: "How long does it take to get set up?",
    answer:
      "Most schools go live within a few days. We set up your school profile, academic year, terms and classes, then help you import students and staff from your existing lists — or add them by hand. Onboarding support is included in every plan.",
  },
  {
    question: "Can I import my existing students and records?",
    answer:
      "Yes. You can import students, teachers, staff and subjects from a spreadsheet (CSV), and our team will gladly help migrate data from your current system so you don't lose any history.",
  },
  {
    question: "How is my school data kept safe?",
    answer:
      "Your data is stored on secure servers with daily backups, encrypted in transit and at rest. Access is controlled by roles and permissions — teachers only see what they need, parents only see their own children, and only school administrators can change core settings.",
  },
  {
    question: "How do parents use the platform?",
    answer:
      "Parents get their own portal where they can view their children's attendance, results, fee statements and school notices. There is no separate app to install and no per-parent licence — parent access is included in every plan.",
  },
  {
    question: "Do we need special hardware or technical staff?",
    answer:
      "No. Mazikor Schools runs in your web browser on computers, tablets and phones. Any staff member with basic computer skills can use it, and we provide training and video guides.",
  },
  {
    question: "What if we outgrow our plan?",
    answer:
      "You can upgrade at any time and the new limits apply immediately. There are no long-term contracts, so you can also downgrade when term numbers change. Our team can advise on the right plan as you grow.",
  },
  {
    question: "Is there support for more than one campus?",
    answer:
      "Yes. The Enterprise plan supports multi-campus and district setups, with the ability to consolidate reporting while keeping each campus independent.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything schools usually ask before switching to Mazikor. Something else?{" "}
            <Link href="/#demo" className="font-medium text-foreground underline underline-offset-4">
              Get in touch
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border bg-card px-5 py-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
