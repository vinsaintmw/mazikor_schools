"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ArrowRightIcon,
  StarIcon,
  Building2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LandingPlan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxStudents: number;
  maxTeachers: number;
  maxStaff: number;
  maxAdmins: number;
  maxStorageGB: number;
}

const TIER_FEATURES: Record<string, string[]> = {
  Starter: [
    "Student, parent and teacher records",
    "Daily attendance tracking",
    "Basic school reports",
    "Email support",
  ],
  Professional: [
    "Everything in Starter",
    "Academic results & report cards",
    "Fees, invoices and payment tracking",
    "Parent portal access",
    "Priority support",
  ],
  Enterprise: [
    "Everything in Professional",
    "Multi-campus and large-school support",
    "Custom branding",
    "Dedicated account manager",
    "API access & advanced analytics",
  ],
};

const PERKS = [
  "Free data migration from your current system",
  "No long-term contracts — cancel anytime",
  "Secure cloud hosting with daily backups",
];

function formatMoney(n: number): string {
  return `MK ${new Intl.NumberFormat("en-MW").format(Math.round(n))}`;
}

export function Pricing({ plans }: { plans: LandingPlan[] }) {
  const [yearly, setYearly] = useState(false);

  const tiers = plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <section id="pricing" className="scroll-mt-20 bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, honest pricing for every school
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start small and grow. Every plan includes onboarding support and all core modules you need
            to run your school day to day.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", !yearly && "text-foreground", yearly && "text-muted-foreground")}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle annual billing"
            onClick={() => setYearly((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              yearly ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
                yearly && "translate-x-5"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium", yearly && "text-foreground", !yearly && "text-muted-foreground")}>
            Annual
            <span className="ml-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Save 13%
            </span>
          </span>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((plan) => {
            const isPopular = plan.name === "Professional";
            const monthly =
              plan.priceMonthly > 0
                ? yearly
                  ? Math.round(plan.priceYearly / 12)
                  : plan.priceMonthly
                : null;
            const custom = plan.priceMonthly === 0;
            const features = [...(TIER_FEATURES[plan.name] ?? []), ...planLimitFeatures(plan)];

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 sm:p-8",
                  isPopular
                    ? "border-primary shadow-xl shadow-foreground/5 ring-2 ring-primary"
                    : "shadow-sm"
                )}
              >
                {isPopular ? (
                  <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <StarIcon className="size-3.5" />
                    Most popular
                  </span>
                ) : null}

                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  {custom ? (
                    <span className="text-4xl font-bold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight tabular-nums">{formatMoney(monthly!)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
                <p className="mt-1 h-4 text-xs text-muted-foreground">
                  {custom
                    ? "Tailored pricing for districts and multi-campus schools"
                    : yearly
                      ? `Billed annually as ${formatMoney(plan.priceYearly)}`
                      : "Billed monthly · cancel anytime"}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckIcon className="size-3" />
                      </span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={isPopular ? "default" : "outline"}
                  size="lg"
                  className="mt-8 w-full"
                  data-icon="inline-end"
                >
                  <Link href="/#demo">
                    {custom ? "Contact sales" : "Start free trial"}
                    <ArrowRightIcon data-icon="inline-end" className="size-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          {PERKS.map((perk) => (
            <span key={perk} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2Icon className="size-4 text-emerald-600" />
              {perk}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function planLimitFeatures(plan: LandingPlan): string[] {
  const features: string[] = [];
  if (plan.maxStudents > 0) features.push(`Up to ${plan.maxStudents.toLocaleString("en-MW")} students`);
  if (plan.maxTeachers > 0) features.push(`Up to ${plan.maxTeachers} teachers`);
  if (plan.maxStaff > 0) features.push(`Up to ${plan.maxStaff} non-teaching staff`);
  if (plan.maxAdmins > 0) features.push(`${plan.maxAdmins} administrator account${plan.maxAdmins === 1 ? "" : "s"}`);
  if (plan.maxStorageGB > 0) features.push(`${plan.maxStorageGB} GB document storage`);
  return features;
}

const DEFAULT_PLANS: LandingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small schools getting started with digital records.",
    priceMonthly: 25000,
    priceYearly: 260000,
    maxStudents: 200,
    maxTeachers: 20,
    maxStaff: 10,
    maxAdmins: 1,
    maxStorageGB: 5,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing schools that need the full school-management toolkit.",
    priceMonthly: 65000,
    priceYearly: 650000,
    maxStudents: 800,
    maxTeachers: 60,
    maxStaff: 40,
    maxAdmins: 3,
    maxStorageGB: 25,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Large institutions and multi-campus schools with advanced needs.",
    priceMonthly: 150000,
    priceYearly: 1500000,
    maxStudents: 5000,
    maxTeachers: 300,
    maxStaff: 200,
    maxAdmins: 10,
    maxStorageGB: 100,
  },
];
