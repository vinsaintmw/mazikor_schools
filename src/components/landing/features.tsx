import {
  UsersIcon,
  CalendarCheckIcon,
  AwardIcon,
  WalletIcon,
  HeartIcon,
  ChartColumnIcon,
} from "lucide-react";

const FEATURES = [
  {
    icon: UsersIcon,
    title: "Student Management",
    description:
      "Complete digital records for every learner — admissions, enrolment, contact details, guardians, status and documents — all searchable in seconds.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Attendance",
    description:
      "Mark daily attendance per class in minutes, spot patterns over time and export registers for inspection without a single paper sheet.",
  },
  {
    icon: AwardIcon,
    title: "Academic Results",
    description:
      "Enter marks per subject, generate report cards automatically and track performance across exams, terms and academic years.",
  },
  {
    icon: WalletIcon,
    title: "Fees Management",
    description:
      "Create fee structures, generate invoices, record cash, bank and mobile-money payments, and see outstanding balances instantly.",
  },
  {
    icon: HeartIcon,
    title: "Parent Portal",
    description:
      "Give parents secure real-time access to their child's attendance, results, fee statements and school notices — no app to install.",
  },
  {
    icon: ChartColumnIcon,
    title: "School Reports",
    description:
      "Turn daily school data into clear reports — enrolment, revenue, performance and trends — so you can lead with confidence.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your school runs on, in one place
          </h2>
          <p className="mt-4 text-muted-foreground">
            Replace scattered registers, spreadsheets and memories with one trusted system that the
            whole school actually uses.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
