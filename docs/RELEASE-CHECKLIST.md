# Mazikor Schools — Release Checklist

Final production checklist for the Mazikor Schools application, plus known limitations.

Date: August 2026
Version: 0.1.0 (release candidate)

---

## 1. Source & environment

- [ ] `.env` exists at the repo root and is **not** committed (`.gitignore` ignores `.env*`).
- [ ] `.env.example` is committed and documents every variable (see `README.md` §5).
- [ ] No secrets (API keys, tokens, `AUTH_SECRET`, DB passwords) appear in tracked files.
- [ ] `AUTH_SECRET` is a fresh, strong random value (`openssl rand -base64 32`).
- [ ] `AUTH_URL` points at the public deployment URL.
- [ ] `NEXT_PUBLIC_APP_URL` points at the public deployment URL (drives sitemap, robots, metadata).
- [ ] `AUTH_TRUST_HOST=true` when behind a proxy (Vercel, Docker, Nginx, etc.).

## 2. Security

- [ ] `NEXT_PUBLIC_DEMO_MODE` is `false` or unset (demo quick-fill buttons are disabled).
- [ ] Demo accounts are **not** seeded in production; or their password is changed immediately after seeding.
- [ ] CSRF/JWT session protection is active (NextAuth credentials + JWT).
- [ ] Proxy headers are applied: CSP (nonce-based), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] All private routes are covered by the proxy auth check and server-side `can()`/`requireAuth()` guards.
- [ ] Database connection uses least-privilege credentials and TLS where available.
- [ ] Database backups configured and restore-tested.

## 3. SEO / metadata

- [ ] `/favicon.ico` and `/favicon.png` exist and are referenced in `src/app/layout.tsx`.
- [ ] `metadataBase`, title template, description and canonical URLs are correct.
- [ ] `/opengraph-image` (1200×630) renders and is used for social sharing.
- [ ] `/robots.txt` disallows all private routes and points at the sitemap.
- [ ] `/sitemap.xml` lists only public pages (home, privacy, terms) with the real domain.
- [ ] Landing page metadata (keywords, Open Graph, Twitter card, JSON-LD) is present.

## 4. Data & migrations

- [ ] `npx prisma migrate deploy` applies cleanly against the production database.
- [ ] Migrations are reviewed before applying (backup first).
- [ ] `npx prisma generate` ran during install/build.
- [ ] Plan/subscription records for production tenants are created via the admin UI, not the seed.

## 5. Quality gates

Run all of the following from a clean checkout:

```bash
npm install
npm run lint        # 0 errors
npx tsc --noEmit    # typecheck passes
npm test            # 46 tests pass (validation, limits, tenant isolation, multi-tenant)
npm run build       # production build succeeds (all routes + proxy)
```

## 6. Smoke test

With a production build running (`npm start`):

- [ ] Fresh login works and returns a session with the correct role and permissions.
- [ ] Logout invalidates the session.
- [ ] RBAC matrix passes: **279 role × page combinations** (`qa-rbac.ps1`).
- [ ] Tenant isolation: cross-tenant reads/modifies are blocked (unit + runtime suites pass).
- [ ] Students / Teachers / Parents / Staff / Classes / Subjects render.
- [ ] Academics: Attendance / Exams / Results / Report cards / Timetable / Assignments render.
- [ ] Finance: Fees / Invoices / Payments / Expenses / Finance dashboard render.
- [ ] Reports render.
- [ ] Public pages: `/`, `/login`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image` return 200.
- [ ] Responsive: desktop sidebar shows on `lg+`, slide-out drawer shows on mobile (app and landing).
- [ ] Dark mode toggles and persists (system/light/dark).

## 7. Deployment

- [ ] `npx prisma migrate deploy` runs as a pre-deploy step.
- [ ] `NEXT_PUBLIC_*` values are set at build time (they are inlined).
- [ ] Node.js 20+ and PostgreSQL 15+ are provisioned.
- [ ] Post-deploy health check: login, a dashboard load, and a public page load all succeed.
- [ ] Monitoring: server logs captured; error surfaces visible to ops.

---

## Known limitations

| Area | Limitation |
| --- | --- |
| Demo request endpoint | `POST /api/demo-requests` is publicly exposed with zod validation but has **no rate limiting or CAPTCHA**. Add a turnstile/rate-limit before a high-traffic public launch. |
| Payment processing | No payment provider is wired up. `src/lib/billing.ts` exposes a `BillingProvider` seam; until `BILLING_PROVIDER` is set, subscriptions are managed manually by platform admins. |
| File storage | There is no upload endpoint. School logos and documents are **URL references** to externally hosted files; no S3/local storage backend is implemented. |
| Reports on the dashboard | Revenue chart and totals render from current-school data only (per-tenant by design). |
| Sending | `src/lib/sms.ts` and `src/lib/notify.ts` provide stubs only — SMS/email delivery is **not** implemented. Notifications are in-app only. |
| PDF generation | Report cards are generated client-side (jsPDF). Printing is browser-dependent and requires client JavaScript. |
| Search | `/api/search` searches within the caller's own school (by design). No cross-tenant or global search. |
| Role management | Custom roles are data-driven (Role + RolePermission) but there is **no admin UI to create custom roles yet** — only built-in seeded roles. |
| Demo data | `npx prisma db seed` **wipes all data** (including production tenants) before seeding. Never run it against production. |
| Line endings | The repo uses LF in files with core.autocrlf on Windows; harmless but visible in diffs. |
