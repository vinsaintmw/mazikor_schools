# Mazikor Schools

Smart School Management, Made Simple.

Mazikor Schools is a multi-tenant school management platform that brings students, teachers, parents, attendance, academics, finance, HR and school administration into one powerful application. Built for Malawian secondary schools (and schools anywhere) to run their day-to-day operations from a single dashboard.

---

## Table of contents

1. [What Mazikor Schools is](#1-what-mazikor-schools-is)
2. [Features](#2-features)
3. [Technology stack](#3-technology-stack)
4. [Installation](#4-installation)
5. [Environment variables](#5-environment-variables)
6. [Database setup](#6-database-setup)
7. [Prisma commands](#7-prisma-commands)
8. [Seed data](#8-seed-data)
9. [Authentication](#9-authentication)
10. [Roles](#10-roles)
11. [Permissions](#11-permissions)
12. [Multi-school architecture](#12-multi-school-architecture)
13. [Tenant isolation](#13-tenant-isolation)
14. [Demo mode](#14-demo-mode)
15. [Plans & subscriptions](#15-plans--subscriptions)
16. [File storage](#16-file-storage)
17. [PDF generation](#17-pdf-generation)
18. [Development commands](#18-development-commands)
19. [Testing](#19-testing)
20. [Production build](#20-production-build)
21. [Deployment](#21-deployment)

---

## 1. What Mazikor Schools is

Mazikor Schools is a production-ready, multi-tenant school management system (SMS). Each school gets its own isolated tenant within one shared platform, with its own users, students, teachers, classes, exams, fees and subscriptions — managed by a platform-level super administrator.

It is designed for:

- **School administrators** — manage students, staff, fees, academic structure and subscriptions.
- **Teachers** — mark attendance, enter exam results, set assignments and view their timetable.
- **Parents** — view their children's attendance, results, report cards, fees and invoices.
- **Students** — access their own academic and fee records.
- **Accountants** — issue invoices, record payments and track expenses.
- **HR** — manage employees, leave and payroll.

---

## 2. Features

- **Students** — full student registry with admissions, streams, notes, import/export.
- **Parents** — parent records and student–parent linking.
- **Teachers & Staff** — teacher and non-teaching staff records with status tracking.
- **Classes & Streams** — academic structure of classes with streams (A/B/C).
- **Subjects & Departments** — subject catalogue, departments, subject–teacher assignment.
- **Attendance** — per-class daily attendance for a date, stream and subject, with notes and statuses (Present / Absent / Late / Excused).
- **Exams & Results** — exam types (Test, Mid-Term, End-of-Term, Mock, Final), subject marks, grading, positions and result publishing.
- **Report cards** — printable/downloadable PDF report cards per student per exam.
- **Timetable** — class and subject timetables.
- **Assignments** — homework with submissions and grading.
- **Notices & Events** — audience-targeted school notices and calendar events.
- **Fees, Invoices & Payments** — fee structures per class/term, invoice generation, payment recording, outstanding balances.
- **Expenses** — school expense tracking with categories.
- **Finance dashboard & reports** — revenue, expenses, net position, outstanding fees.
- **Library** — book catalogue with loans and overdue tracking.
- **Transport** — vehicles and routes.
- **Inventory** — equipment and supplies tracking with valuation.
- **HR** — employees, departments, leave requests, payroll runs.
- **Reports** — aggregated academic and financial reports.
- **Settings** — school profile, branding, plan usage, academic years and terms.
- **Platform admin** — schools, users, subscriptions, plans, audit logs and settings across all tenants.
- **Search & notifications** — global search API and per-user notifications.
- **Onboarding wizard** — guided school setup (profile → academic year → classes → subjects → fees).
- **Theming** — light/dark mode, per-school branding colours, fully responsive (mobile & desktop).

---

## 3. Technology stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16.3 (App Router) |
| UI library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives) |
| Database | PostgreSQL 15+ via Prisma ORM 6 |
| Authentication | NextAuth v5 (Credentials provider, bcrypt, JWT sessions) |
| Charts | Recharts |
| PDF | jsPDF + jsPDF-AutoTable (client-side) |
| Validation | Zod 4 |
| Forms | React Hook Form (landing demo form) |
| Toasts | Sonner |
| Icons | Lucide |
| Date picker | react-day-picker |
| CLI | shadcn, Prisma CLI, tsx |

Requires **Node.js 20+** (Node 24 recommended) and **PostgreSQL 15+**.

---

## 4. Installation

```bash
# 1. Clone the repository
git clone https://github.com/vinsaintmw/mazikor_schools.git
cd mazikor_schools

# 2. Install dependencies
npm install

# 3. Configure environment variables (see section 5)
cp .env.example .env.local   # or create .env and fill in the values

# 4. Set up the database (see section 6)
npx prisma migrate dev

# 5. (Optional) load demo data
npx prisma db seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** there is no committed `.env.example` yet — create your `.env` from the variable list in section 5.

---

## 5. Environment variables

All configuration lives in a `.env` file at the repository root (gitignored). Only `NEXT_PUBLIC_*` variables are exposed to the browser and are baked in at build time.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/mazikor?schema=public` |
| `AUTH_SECRET` | Yes | Secret used to sign auth JWTs. Generate with `openssl rand -base64 32`. |
| `AUTH_URL` | Yes* | Canonical URL of the deployment (used by NextAuth), e.g. `https://schools.example.com`. Legacy alias: `NEXTAUTH_URL`. |
| `AUTH_TRUST_HOST` | Yes* | Set to `true` when running behind a proxy/Vercel so NextAuth trusts the forwarded host. |
| `NEXT_PUBLIC_APP_NAME` | No | App name used in branding (default `Mazikor Schools`). |
| `NEXT_PUBLIC_APP_TAGLINE` | No | App tagline used in metadata (default `Smart School Management, Made Simple.`). |
| `NEXT_PUBLIC_APP_URL` | No | Public site URL used for `metadataBase`, sitemap and robots (default `https://schools.mazikor.com`). Fallback alias: `NEXT_PUBLIC_SITE_URL`. |
| `NEXT_PUBLIC_DEMO_MODE` | No | `true` shows demo quick-fill buttons on the login page. **Never enable in production.** Default `false`. |
| `BILLING_PROVIDER` | No | Enables online payments when set to a registered provider id (e.g. `stripe`, `paystack`). When unset, subscriptions are managed manually by platform admins (see section 15). |
| `BILLING_WEBHOOK_SECRET` | No | Provider webhook signing secret, used server-side to verify `/api/webhooks/billing` requests. |
| `BILLING_GRACE_PERIOD_DAYS` | No | Days a `PAST_DUE` subscription stays accessible after the missed renewal (default `7`). |

`AUTH_URL`, `NEXT_PUBLIC_APP_URL` and `AUTH_SECRET` **must be set to production values at build/deploy time** — public values are inlined into the client bundle.

---

## 6. Database setup

The application uses **PostgreSQL** with Prisma ORM.

```bash
# Create the database (adjust to your PostgreSQL setup)
createdb mazikor

# Create the schema and apply migrations
npx prisma migrate dev

# Generate the Prisma client (done automatically by install/migrate)
npx prisma generate
```

Migrations live in `prisma/migrations/`. In production use `npx prisma migrate deploy` (non-interactive).

---

## 7. Prisma commands

| Command | Purpose |
| --- | --- |
| `npx prisma migrate dev` | Create/apply migrations in development |
| `npx prisma migrate deploy` | Apply pending migrations in production |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma db seed` | Load seed/demo data |
| `npx prisma studio` | Browse the database in a browser |
| `npx prisma db push` | Push the schema without a migration (dev only) |

The schema is defined in `prisma/schema.prisma`. Seeding is configured in `package.json` (`"prisma": { "seed": "tsx prisma/seed.ts" }`).

---

## 8. Seed data

```bash
npx prisma db seed
```

The seed (`prisma/seed.ts`) **wipes existing demo data** and then creates:

- All 9 built-in roles with their default permission sets.
- Pricing plans (seed creates active plans used by the pricing page).
- The demo school **Mazikor Secondary School** with a full academic structure: academic year, 4 form levels with streams, departments, 15 subjects, a grade scale, classes and streams.
- Teachers, staff, students, parents, employees and demo user accounts.
- Attendance records, exams with results and computed positions.
- Fee structures, invoices, payments and expenses.
- Timetable entries, assignments, notices, events, library books, transport vehicles/routes, inventory items.
- Payroll, leave and staff attendance records.
- Notifications, audit log entries and documents.

### Demo accounts

All demo accounts use the password `Mazikor2026!`.

| Role | Email |
| --- | --- |
| Super Admin | `superadmin@mazikor.mw` |
| School Admin | `admin@mazikor.mw` |
| Principal | `principal@mazikor.mw` |
| Teacher | `chisomo.banda@mazikor.mw` |
| Accountant | `accountant@mazikor.mw` |
| HR | `hr@mazikor.mw` |
| Librarian | `librarian@mazikor.mw` |
| Parent | `parent@mazikor.mw` |
| Student | `student@mazikor.mw` |

> **Security:** demo accounts are real records with bcrypt-hashed passwords. Do **not** ship the seed to production, or change the password immediately after seeding.

---

## 9. Authentication

- **Provider:** NextAuth v5 **Credentials** — email + password, bcrypt-verified against the `User` table.
- **Sessions:** stateless **JWTs** (1-day max age) carrying the user id, role, school and resolved permission list.
- **Login:** `/login` with error handling and `callbackUrl` support.
- **Route protection:** a Next.js **proxy** (`src/proxy.ts`) verifies the JWT for every private path and redirects to `/login` when unauthenticated. Server components additionally call `requireAuth()` / `can()`.
- **Security headers:** the proxy applies a nonce-based Content-Security-Policy plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict referrer policy and a restrictive permissions policy on every response.
- **Session checks on sign-in:** inactive users and users whose school is deactivated are rejected.

---

## 10. Roles

Nine built-in roles are defined in `src/lib/constants.ts` (`ROLE_KEYS`):

| Role key | Description |
| --- | --- |
| `super_admin` | Platform owner — manages all tenants, bypasses all permission checks |
| `school_admin` | Full access within their own school |
| `principal` | Academic leadership — students, teachers, exams, results, reports |
| `teacher` | Attendance, results entry, assignments, timetable |
| `accountant` | Fees, invoices, payments, expenses, financial reports |
| `parent` | Read-only view of their child(ren)'s records |
| `student` | Read-only view of their own records |
| `librarian` | Library management |
| `hr` | Staff, employees, leave and payroll |

Roles are seeded into the database (`Role` table) and are referenced by key. Custom roles can be added at the platform level.

---

## 11. Permissions

The permission system is permission-based (not role-based) at the point of use:

- `src/lib/constants.ts` defines the full **`PERMISSIONS` catalogue** (e.g. `students.view`, `invoices.create`, `payroll.manage`) and the default permission set per built-in role (`ROLE_PERMISSIONS`).
- On sign-in, the user's effective permissions are resolved as `built-in defaults ∪ DB role permissions` (`resolvePermissions` in `src/lib/auth.ts`) and embedded in the JWT.
- Server actions and pages guard with `can(session, "perm")`, `requirePermission(session, "perm")` or `requireRole(...)`. `super_admin` always passes.
- Permissions can be extended per role through the `RolePermission` table without code changes.

**Testing:** an automated RBAC suite checks **279 role × page combinations** (HTTP body-level assertions) and every known combination passes.

---

## 12. Multi-school architecture

- Every domain entity belongs to a `School` tenant through a `schoolId` foreign key (students, parents, teachers, staff, classes, subjects, attendance, exams, results, fees, invoices, payments, expenses, timetable, assignments, notices, events, library, transport, inventory, HR, documents, notifications, academic years).
- Users are scoped to a school (`user.schoolId`); the `super_admin` spans all schools with no `schoolId`.
- Each school has its own subscription, plans, roles and branding (logo, primary/secondary colours, currency).
- Onboarding: a new school goes through a guided setup wizard before its first academic year exists.
- Platform admin UI (`/admin`) is available only to `super_admin`.

---

## 13. Tenant isolation

- Every Prisma query in the application filters by the current user's `schoolId` (`getSchoolId(session)`).
- Cross-tenant access is impossible through the UI and is defended server-side: pages and server actions resolve records as `findFirst({ where: { id, schoolId } })`, never `findUnique({ where: { id } })`.
- The `super_admin` intentionally bypasses tenant scoping for platform management.
- Public API routes are either scoped to the session's school (search, notifications) or require no auth and accept only validated input (demo requests).
- **Tests:** `tests/tenant-isolation.test.ts` and `tests/multi-tenant.test.mts` verify that records from one tenant can never be read or modified from another tenant (including at the runtime HTTP layer).

---

## 14. Demo mode

Demo mode is purely a **front-end convenience** and never bypasses authentication, permissions or tenant isolation:

- When `NEXT_PUBLIC_DEMO_MODE=true`, the login page shows quick-fill chips for the demo accounts (password `Mazikor2026!`).
- It only pre-fills the credential form; sign-in still goes through the normal password verification and JWT flow.
- The platform admin settings page reflects the mode for transparency.
- **Production default is `false`.** Never ship a production deployment with demo mode enabled.

---

## 15. Plans & subscriptions

- **Plans** (`Plan` model) define pricing and usage limits: `maxStudents`, `maxTeachers`, `maxStaff`, `maxAdmins`, `maxStorageGB` plus feature flags and optional provider references (`providerRef` / `providerYearlyRef` for monthly/yearly billing).
- **Subscriptions** link a school to a plan with a status (`TRIAL`, `ACTIVE`, `PAST_DUE`, `EXPIRED`, `CANCELLED`, `INCOMPLETE`), an interval (`MONTHLY`/`YEARLY`), price/currency, provider customer/subscription ids, renewal date and optional per-subscription `customLimits` overrides.
- **Usage limits** (`src/lib/limits.ts`) are resolved per school and enforced server-side (`enforceLimit`) on student/teacher/staff creation. `null` or `<= 0` means unlimited.
- The Settings page shows current plan, subscription status and usage bars against limits. A dedicated **Billing page** (`/settings/billing`) shows price, interval, renewal, plan usage, a plan switcher and provider status, and is where checkout/cancel/sync actions live.
- **Online billing is not wired to a provider yet.** `src/lib/billing.ts` defines a `BillingProvider` seam (checkout, plan change, cancel, webhook) that resolves to a null provider unless `BILLING_PROVIDER` is set. Webhook events are applied idempotently via `applyBillingEvent` (`src/lib/billing-webhooks.ts`), and status is never trusted from the browser — the provider webhook is the single source of truth. Until a provider is configured, subscriptions are managed manually by platform administrators and nothing is faked. See **`docs/BILLING.md`** for the architecture and exactly what's needed to go live.

---

## 16. File storage

- **School logo:** a URL field on the school profile (`school.logo`) displayed in the sidebar and branding. Administrators provide an image URL (external hosting/CDN); there is no upload endpoint.
- **Documents:** the `Document` model stores metadata (`name`, `fileType`, `size`) plus a `url` reference for externally hosted files. Storage backends (S3, local disk, etc.) are not implemented — schools link existing files.
- Generated files (PDF report cards) are produced in the browser and downloaded directly; nothing is written to the server.

---

## 17. PDF generation

Report cards are generated **client-side** in the browser:

- `src/components/report-cards/report-card-pdf.tsx` uses **jsPDF** + **jsPDF-AutoTable** (lazy-loaded on demand).
- The report card shows the student, admission number, class, exam, per-subject marks, percentages, grades, points, average, total points and position.
- PDFs are downloaded as `report-card-<admissionNumber>.pdf` — no server-side rendering or storage required.

---

## 18. Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm start` | Run the production build (`next start`) |
| `npm run lint` | Lint the codebase (ESLint) |
| `npm test` | Run the test suite (node:test + tsx) |
| `npx prisma studio` | Open the database UI |
| `npx prisma db seed` | Load demo data |

Run the production server on a custom port with `npm start -- -p 3100`.

---

## 19. Testing

```bash
npm test
```

The suite uses **Node's built-in test runner** with `tsx`:

- `tests/validation.test.ts` — Zod field validation for forms and API payloads.
- `tests/limits.test.ts` — plan limit resolution and overrides.
- `tests/billing.test.ts` — provider status mapping, subscription access policy and price helpers.
- `tests/tenant-isolation.test.ts` — cross-tenant reads/writes are blocked.
- `tests/multi-tenant.test.mts` — runtime HTTP-level tenant isolation checks.

In addition, the release process runs an automated **RBAC matrix** (279 role × page combinations) against a running server.

Run all release gates before shipping:

```bash
npm run lint      # 0 errors
npx tsc --noEmit  # typecheck
npm test          # all tests pass
npm run build     # production build
```

---

## 20. Production build

```bash
# 1. Ensure production env vars are set (section 5)
# 2. Apply database migrations
npx prisma migrate deploy
# 3. Build
npm run build
# 4. Run
npm start
```

Notes:

- `NEXT_PUBLIC_*` values are inlined at build time — rebuild when they change.
- The proxy (middleware) enforces CSP, security headers and route authentication at the edge.
- The build output is fully self-contained; no server-side dependencies beyond Node + PostgreSQL.

---

## 21. Deployment

**Requirements:** Node.js 20+ and PostgreSQL 15+.

**Platform options**

- **Vercel / Netlify** — set the env vars in the dashboard, add the PostgreSQL connection string, and deploy. Run `npx prisma migrate deploy` as a build/pre-deploy step.
- **Docker / VPS** — build the image, run `npx prisma migrate deploy` against the production database, then `npm start` behind a reverse proxy (Caddy, Nginx, etc.).

**Production checklist**

- [ ] `.env` contains a strong `AUTH_SECRET` and the real `AUTH_URL`.
- [ ] `NEXT_PUBLIC_APP_URL` set to the public domain (used for sitemap/robots/metadata).
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` (or unset).
- [ ] Migrations applied with `npx prisma migrate deploy`.
- [ ] Demo data is **not** seeded in production.
- [ ] Database is backed up regularly; migrations are reviewed before deploy.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` all pass.

See **`docs/RELEASE-CHECKLIST.md`** for the final production checklist and known limitations.

---

## License

Proprietary — all rights reserved.
