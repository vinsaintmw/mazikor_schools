import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  PlayCircleIcon,
  Building2Icon,
  UsersIcon,
  ChartColumnIcon,
  FileTextIcon,
  WalletIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeIcon,
  LineChartIcon,
  SparklesIcon,
  MailIcon,
  PhoneIcon,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/landing/site-header";
import { Features } from "@/components/landing/features";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Pricing, type LandingPlan } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { DemoForm } from "@/components/landing/demo-form";

export function LandingPage({ plans }: { plans: LandingPlan[] }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <DashboardSection />
        <Benefits />
        <Pricing plans={plans} />
        <Faq />
        <DemoSection />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,var(--muted),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_40%,transparent_100%)]"
      />

      <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <SparklesIcon className="size-3.5 text-primary" />
            The all-in-one school management platform
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Smart School Management,
            <br />
            <span className="text-muted-foreground">Made Simple.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            Mazikor Schools brings students, teachers, attendance, academics, fees and school
            administration into one powerful platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto" data-icon="inline-end">
              <Link href="/#demo">
                Get Started
                <ArrowRightIcon data-icon="inline-end" className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/#demo">
                <PlayCircleIcon className="size-4" />
                Request a Demo
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Free 30-day trial · No credit card required · Setup in days
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden="true"
            className="absolute -inset-x-8 top-6 -z-10 h-full rounded-[2rem] bg-gradient-to-t from-primary/10 via-transparent to-transparent blur-2xl"
          />
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const schools = [
    "Likoma Academy",
    "Mzuzu Grammar",
    "Blantyre Day Secondary",
    "Lilongwe Prep",
    "Zomba Christian",
    "Karonga International",
  ];
  return (
    <section className="border-y bg-muted/40 py-10">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-muted-foreground">
          Trusted by administrators at schools across Malawi
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {schools.map((name) => (
            <span
              key={name}
              className="text-base font-semibold tracking-tight text-muted-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Building2Icon,
    step: "1",
    title: "Set Up Your School",
    description:
      "Add your school profile, academic year, terms and class structure. Import students, teachers and staff from a spreadsheet or add them manually.",
  },
  {
    icon: UsersIcon,
    step: "2",
    title: "Manage Your School",
    description:
      "Take attendance, enter marks, record fees, publish notices and run your day-to-day operations from one dashboard — no paperwork chasing.",
  },
  {
    icon: ChartColumnIcon,
    step: "3",
    title: "Understand Your School",
    description:
      "See enrolment, attendance, revenue and academic performance as clear reports, and make decisions backed by real data.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            From first login to a fully digital school in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              {i < STEPS.length - 1 ? (
                <div
                  aria-hidden="true"
                  className="absolute top-8 right-[-2rem] hidden h-px w-16 border-t-2 border-dashed border-muted-foreground/30 lg:block"
                />
              ) : null}
              <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-heading text-5xl font-bold text-muted-foreground/15">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">The dashboard</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Your whole school at a glance
          </h2>
          <p className="mt-4 text-muted-foreground">
            Students, attendance, fees and academic performance — live in one view, built from the
            same screens your staff will use every day.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: UsersIcon, label: "Students", value: "1,247", note: "All enrolment in one register" },
            { icon: FileTextIcon, label: "Attendance", value: "94.5%", note: "Marked daily in minutes" },
            { icon: WalletIcon, label: "Fees", value: "MK 4.8M", note: "Collected this term" },
            { icon: LineChartIcon, label: "Academic", value: "82% avg", note: "Pass rate across all classes" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border bg-card p-6 shadow-sm">
              <item.icon className="size-5 text-primary" />
              <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  {
    icon: FileTextIcon,
    title: "Reduce paperwork",
    description: "Registers, fee ledgers and result sheets become digital — nothing to file, nothing to lose.",
  },
  {
    icon: BellIcon,
    title: "Save administrative time",
    description: "Attendance, grading and fee recording take minutes, not afternoons, freeing staff for teaching.",
  },
  {
    icon: GlobeIcon,
    title: "Improve school visibility",
    description: "Real-time data and clean reports make it easy to showcase performance to boards and inspectors.",
  },
  {
    icon: UsersIcon,
    title: "Keep parents informed",
    description: "Parents see attendance, results and fee statements instantly — fewer calls to the office.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Centralize school data",
    description: "Every record lives in one secure system with role-based access, not in personal spreadsheets.",
  },
  {
    icon: LineChartIcon,
    title: "Make better decisions",
    description: "Spot trends in enrolment, attendance, fees and performance before they become problems.",
  },
];

function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Why Mazikor</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            The outcomes schools notice within a term
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <benefit.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="scroll-mt-20 bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Request a demo</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              See Mazikor Schools working with your own school data
            </h2>
            <p className="mt-4 text-muted-foreground text-pretty">
              Tell us about your school and we&apos;ll walk you through a personalised demo — setup,
              attendance, results, fees and reporting. No pressure, no obligation.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "A guided walkthrough tailored to your class structure",
                "A free 30-day trial once you're ready",
                "Help importing your existing student records",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <CheckIcon className="size-3" />
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a
                href="mailto:hello@mazikor.mw"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm transition-colors hover:bg-muted"
              >
                <MailIcon className="size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Email us</p>
                  <p className="text-xs text-muted-foreground">hello@mazikor.mw</p>
                </div>
              </a>
              <a
                href="tel:+265991234567"
                className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm transition-colors hover:bg-muted"
              >
                <PhoneIcon className="size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Call us</p>
                  <p className="text-xs text-muted-foreground">+265 99 123 4567</p>
                </div>
              </a>
            </div>
          </div>

          <DemoForm />
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = {
  Features: [
    { label: "Student Management", href: "/#features" },
    { label: "Attendance", href: "/#features" },
    { label: "Academic Results", href: "/#features" },
    { label: "Fees Management", href: "/#features" },
    { label: "School Reports", href: "/#features" },
  ],
  Company: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Request a Demo", href: "/#demo" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#demo" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Login", href: "/login" },
  ],
};

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt={`${"Mazikor Schools"} logo`}
                width={1024}
                height={1024}
                className="size-8 rounded-lg object-contain ring-1 ring-foreground/10"
              />
              <span className="text-lg font-semibold tracking-tight">Mazikor Schools</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Smart School Management, Made Simple. Students, teachers, attendance, academics, fees
              and administration — in one powerful platform.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold">{group}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mazikor Schools. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for schools across Malawi and East Africa.
          </p>
        </div>
      </div>
    </footer>
  );
}
