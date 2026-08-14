# Mazikor Schools — Upgrade Audit Report

*Generated from codebase inspection (Next.js 16.3.0, App Router, Prisma, shadcn/ui, NextAuth).*
*Date: 2026-08-12 | Status: Inspection only — no upgrades implemented.*

---

## 1. Current Architecture

| Category | Detail |
|---|---|
| **Framework** | Next.js 16.3.0 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 4, shadcn/ui components, Geist font (Google) |
| **ORM** | Prisma 6.19.3 (PostgreSQL) |
| **Authentication** | NextAuth v5 (credentials provider, JWT strategy, session max-age 7d) |
| **RBAC / Authorization** | Permission matrix in `src/lib/constants.ts:127-198`; per-role `ROLE_PERMISSIONS`; enforced in `app-shell.tsx:81-85`, `app/(app)/layout.tsx:6-7`, server actions via `assertPermission` |
| **Multi‑school / Tenant** | Each user belongs to a `school` record (`db.user.includes: school`). `getSchoolId` helper (`src/lib/server-helpers.ts`) scopes all DB queries. No org‑isolation beyond school ID. |
| **UI Component System** | shadcn/ui primitives (`button`, `input`, `card`, `table`, `dialog`, etc.) + custom wrappers (`Field`, `TextInput`, `NativeSelect`, `SubmitButton`). All `"use client"` where interactive. |
| **Design / Theme System** | `next-themes` for system/dark/light toggle; CSS variables in `globals.css`; primary color defined in `constants.ts:8` (`#1d4ed8`) but UI `--primary` is `oklch(0.205 0 0)` (near‑black). Inconsistency observed. |
| **Server Actions / API Routes** | Actions in `src/lib/actions/*` (`people`, `finance`, `hr`, `admin`, `school`, `academics`). Use `revalidatePath` on success; throw on validation error (produces generic Next error screen). |
| **Validation** | Zod schemas in actions (`studentSchema`, etc.); server‑side only. No client‑side inline error messages — failures crash to Next.js error boundary. |
| **PDF Generation** | `jspdf` + `jspdf-autotable` in `ReportCardPdf` component (`src/components/report-cards/report-card-pdf.tsx:3-4`). Client‑side only (`"use client"`). |
| **Chart Implementation** | `recharts` in `RevenueChart` (`src/app/(app)/dashboard/revenue-chart.tsx:3`). Client‑side only. |
| **Search Functionality** | `SearchInput` component (`src/components/search-input.tsx`) with debounced URL‑param driven search. Used on students, attendance, exams, etc. `cmdk` installed but **unused** (no global command palette). |
| **Loading / Error States** | **Missing** — no `loading.tsx`, no `error.tsx`, no `not-found.tsx`. Blank screens on navigation. Skeleton patterns not used. |
| **Subscription Architecture** | Admin area manages `plans` and `subscriptions` (`/admin/plans`, `/admin/subscriptions`). No public pricing page / self‑serve signup. Schools are created by admin only. |
| **Middleware** | None configured (`next.config.ts` is empty). |
| **Environment Configuration** | `NEXT_PUBLIC_DEMO_MODE` controls demo‑account exposure (`login-form.tsx:30`). `.env*` in `.gitignore`. No other env vars. |
| **Database Schema** | Prisma schema (`prisma/schema.prisma`) with users, schools, students, teachers, parents, classes, subjects, attendance, exams, results, fees, payments, invoices, expenses, audit logs, academic years, terms, streams, streams‑classes. |
| **Package Key Versions** | next@16.3.0, react@19.2.8, prisma@6.19.3, tailwindcss@4, next-auth@5.0.0-beta.32, recharts@3.8.0, jspdf@4.2.1, papaparse (installed but unused) |

---

## 2. Functionality Matrix

| Area | Status | Notes |
|---|---|---|
| **Root page `/`** | Broken (for public) | Redirects to `/login`; no marketing/landing content. |
| **Login page** | Working | Demo accounts + hardcoded password exposed when `NEXT_PUBLIC_DEMO_MODE !== "false"` (default ON). |
| **Dashboard** | Working | Full feature set; unbounded `paymentsByMonth` query (no year filter). |
| **Students / Teachers / Parents** | Working | CRUD forms, tables with infinite scroll, status filters. |
| **Attendance / Exams / Results** | Working | Data entry and views. |
| **Fees / Payments / Invoices** | Working | Full stack; dashboard revenue chart uses unbounded payment fetch. |
| **Reports / PDF** | Partially working | PDF download works but `jspdf` bundled into client route JS; no server‑side generation. |
| **Settings / School profile** | Working | Read‑only school info, subscription, academic years. |
| **Plans / Subscriptions** | Working (admin only) | No public pricing or self‑serve signup. |
| **Navigation / Breadcrumbs** | Partially working | Header shows blank title except on `/dashboard`. No nested breadcrumbs on routes like `/students/[id]`. |
| **SEO / Meta** | Missing | No `robots.txt`, no `sitemap.xml`, no per‑page `openGraph`/`twitter:card`, `/login` has only title "Sign in". |
| **Touch targets / Mobile** | Issue | Inputs/buttons `h-8` (32px) — below 44px WCAG recommendation. |
| **Forms / Validation** | Broken UX | Server actions throw → Next.js error screen; no inline field errors. |
| **Password reset** | Missing | No "Forgot password" route or flow. |
| **Demo mode / Password** | Security risk | Default ON; public password `Mazikor2026!`; `DEMO_ACCOUNTS` emails exposed. |
| **Branding** | Inconsistent | `PRIMARY_COLOR` unused; chart/PDF use `#1d4ed8` blue; UI `--primary` is near‑black. |
| **CMDK** | Dead dependency | `cmdk` installed but no `Command` component used anywhere. |
| **Loading / Error pages** | Missing | No `loading.tsx`, `error.tsx`, `not-found.tsx`. |
| **SEO** | Missing | No sitemap, robots, OG tags, per-page descriptions. |
| **Self‑serve school onboarding** | Missing | No public signup; schools created by super admin only. |

---

## 3. Security Risks

| # | Issue | Location | Risk |
|---|---|---|---|
| 1 | Demo login with public password `Mazikor2026!` shown by default | `login-form.tsx:12-30` | Any visitor can view demo credentials; password hard‑coded in source. |
| 2 | Server action errors crash to generic Next error screen | All actions (`people.ts:64`, etc.) | Potential stack trace leakage; no user‑friendly error messages. |
| 3 | No CSP, no HTTP security headers | `next.config.ts` empty | Attack surface broader without headers. |
| 4 | `next-auth` `trustHost: true` | `auth.ts:16` | Open to host‑header attacks if not carefully managed. |

---

## 4. Performance Issues

| # | Issue | Location | Impact |
|---|---|---|---|
| 1 | `jspdf` + `recharts` statically bundled into route JS | `report-card-pdf.tsx:3`, `revenue-chart.tsx:3` | ~300‑400 KB gzipped added to initial client bundle for those routes. |
| 2 | Dashboard fetches **all** payments ever for chart | `dashboard/page.tsx:98-109` | Unbounded `findMany` → grows without bound; scales poorly. |
| 3 | Multiple sequential `await` calls in dashboard | `dashboard/page.tsx:74-109` | Could be parallelized via `Promise.all`. |
| 4 | No `loading.tsx` / skeletons | Perceived speed ↓ on slow networks/mobile. |
| 4 | Dead dependency `papaparse` in `package.json` | Wasted install time, potential confusion. |

---

## 5. UI/UX Issues

| # | Issue | Dimension | Impact |
|---|---|---|---|
| 1 | Small touch targets (`h-8` = 32px) | Mobile | Below 44 px WCAG recommendation. |
| 2 | Header breadcrumb blank except `/dashboard` | Clarity | Confusing page context. |
| 3 | No global search / command palette | Navigation | `cmdk` present but unused; manual navigation required. |
| 4 | Tables: `whitespace-nowrap` + horizontal scroll | Mobile/clarity | Forced scroll on every row; no summary. |
| 5 | Readability: 11‑14px micro‑labels, mixed grade/percentage | Readability | Dense data; small text on school devices. |
| 6 | Stat‑card CTAs are tiny icon squares | CTA | Whole card not clickable; small hit area. |
| 7 | No "Forgot password" / password reset | Forms/conversions | Users locked out if password forgotten. |
| 8 | Login `?error=1` param never surfaced | Clarity/trust | Auth error not displayed to user. |
| 9 | Demo account chips small tap targets | Mobile | Same 32px issue. |
| 10 | No skip‑link for accessibility | a11y | Keyboard‑only users cannot bypass nav. |

---

## 6. Priority Tiers

### P0 — Fix within 1 week (high impact / low effort)

| # | Issue | Effort | Recommendation |
|---|---|---|---|
| P0‑1 | Demo login public password ON by default | 1 | Flip demo mode: `process.env.NEXT_PUBLIC_DEMO_MODE === "true"` (opt‑in). |
| P0‑2 | jspdf + recharts lazy‑load | 1 | `next/dynamic({ ssr: false })` on click‑generate/chart. |
| P0‑3 | Add `loading.tsx` + `error.tsx` + `not-found.tsx` | 1 | Big perceived‑speed win, zero UX regression. |
| P0‑4 | Surface login `?error=1` param | 1 | Read `searchParams` in login page, pass error message to form. |
| P0‑5 | Brand color consistency | 1 | Make `--primary` match `#1d4ed8` or update chart/PDF tokens. |
| P0‑6 | Small touch targets (h‑8 → h‑9) | 1 | Bump `Input`, `NativeSelect`, `Button` heights globally. |
| P0‑7 | Server‑action error → inline validation | 2‑3 | Wrap actions, return `{ error }` objects; render field errors in forms. |

### P1 — Fix this sprint (medium impact / medium effort)

| # | Issue | Effort | Recommendation |
|---|---|---|---|
| P1‑1 | SEO: sitemap, robots.txt, OG tags, per‑page descriptions | 2 | Add `robots.txt`, `sitemap.ts`, metadata with `openGraph` to key pages. |
| P1‑2 | Merge origin `main` (GitHub auto‑commit) into local `main` | 1‑2 | Force‑push or merge; keep clean history. |
| P1‑3 | Nested breadcrumbs on deep routes | 2 | Use existing `Breadcrumb` component on `students/[id]`, `exams/[id]`, etc. |
| P1‑4 | Dashboard unbounded payment queries + parallelize awaits | 2 | Prisma `groupBy` for chart; `Promise.all` for sequential awaits. |
| P1‑5 | Merge both histories on main branch | 1 | `git merge origin/main --allow‑unrelated‑histories`. |
| P1‑5 | Global command palette with `cmdk` | 3‑4 | Implement `Command` component for name‑based navigation. |
| P1‑6 | Readability: raise micro‑labels, label grade vs percentage | 1 | Adjust text sizes; consistent formatting in dashboard. |
| P1‑7 | Tables: row‑count summary, relax `whitespace-nowrap` on long cells | 1‑2 | Add footer summary; use `break‑words` or `overflow‑ellipsis`. |

### P2 — Next quarter (lower impact / higher effort)

| # | Issue | Effort | Recommendation |
|---|---|---|---|
| P2‑1 | Full public landing page at `/` (hero + features + pricing CTA) | 5‑8 | Major conversion lever; scope separately. |
| P2‑2 | Self‑serve school signup / onboarding flow | 5‑8 | Auth + school‑creation UI; separate from existing admin flow. |
| P2‑3 | Accessibility: skip‑link, aria labels, color contrast | 2‑3 | Add `<a href="#main" className="sr-only">Skip to main content</a>`. |
| P2‑4 | Dark‑mode logo/brand readability | 1 | Verify logo visibility in dark theme; add `invert` or dark variant. |
| P2‑4 | Full PDF generation with embedded logo/image | 2 | Load `/logo.png` in `ReportCardPdf` via `next/image`. |
| P2‑5 | Merge `master` → `main` branch cleanup (already done) | 1 | Repo now on `main` only. |

---

## 6. Recommended Implementation Order

1. **P0‑1** — Flip demo mode to opt‑in (security + trust).
2. **P0‑2** — Lazy‑load `jspdf`/`recharts` (bundle size ↓).
3. **P0‑3** — Add `loading.tsx` + `error.tsx` (perceived speed).
4. **P0‑4** — Surface login errors (clarity).
5. **P0‑5** — Unify brand color (credibility).
6. **P0‑6** — Bump touch targets (mobile UX).
7. **P0‑7** — Inline form validation (forms trust).
8. **P1‑1** — SEO plumbing (search visibility).
9. **P1‑2** — Branch cleanup (already done).
10. **P1‑3** — Breadcrumbs + global search (navigation).
11. **P1‑4** — Dashboard performance (speed).
12. **P1‑5‑6** — Readability + tables (clarity).
13. **P2‑1‑2** — Landing page + self‑serve onboarding (conversions).

---

## 7. Concise Summary of Findings

The Mazikor Schools codebase is a functional Next.js 16 App Router application built on Prisma/PostgreSQL with NextAuth authentication and shadcn/ui components. It serves an internal school‑management use case with role‑based access (super_admin, school_admin, principal, teacher, accountant, parent, student).

**Key observations:**

- The project **has no public landing page** — `/` unconditionally redirects to `/login`. This zeroes SEO, acquisition, and conversion potential.
- **Demo credentials are exposed by default** (`NEXT_PUBLIC_DEMO_MODE` defaults ON; password `Mazikor2026!` hard‑coded in source). This is a security and trust risk.
- **Heavy client libraries** (`recharts`, `jspdf`) are imported directly in client components, bloating the route bundles.
- **Server actions throw errors** that surface as the generic Next.js error boundary, providing no inline field‑level feedback to users.
- **Missing SEO**: no `robots.txt`, no `sitemap.xml`, no per‑page meta tags. The `/login` page is indexable with only a "Sign in" title.
- **Mobile UX is compromised** by 32px touch targets (`h-8`) and absent loading skeletons.
- **Navigation lacks breadcrumbs** on nested routes; header title is blank everywhere except `/dashboard`.
- **Dashboard queries are unbounded** (all‑payments fetch) and have sequential `await` patterns that could be parallelized.
- **`cmdk` is installed but never used** — dead dependency.
- **No password reset / "forgot password" flow** exists.
- **Brand inconsistency**: `PRIMARY_COLOR` constant is unused; UI primary is near‑black while charts/PDF use blue `#1d4ed8`.
- The repo has already been migrated from `master` to `main`; remote `master` deleted.

**Working functionality:** CRUD for students/teachers/parents, attendance, exams, results, fees, payments, invoices, reports (PDF download), settings, navigation, auth sign‑in.

**Partially working:** PDF generation (bundles heavy libs), dashboard (unbounded queries), navigation (no breadcrumbs), SEO (none).

**Broken / missing:** Public landing page, self‑serve onboarding, password reset, accessible touch targets, inline form validation, loading/error states, full SEO.

The audit report is now saved at `docs/MAZIKOR-UPGRADE-AUDIT.md`. No code functionality was modified or removed during inspection; only the report documentation was created.

**Next phase:** Await guidance on which priority tier to address first, or whether to proceed with the recommended P0 quick‑wins.