# Billing & Subscriptions — Design

Status: **Foundation only.** No payment provider is wired up yet. This document describes
the target architecture and exactly what is needed to go live.

## 1. Principle

**The billing provider's webhook is the ONLY source of truth for payment and
subscription status.**

- A frontend "payment successful" redirect proves nothing and is never acted on.
- The browser never submits a price, plan price, or subscription status. Prices come from
  the `Plan` row (server-side); status comes from provider confirmations.
- Provider secret keys and webhook signing secrets exist only server-side.
- Until `BILLING_PROVIDER` is set, the null provider makes every payment operation fail
  loudly (`BillingProviderNotConfiguredError`) and the webhook endpoint returns 501.
  Nothing is faked.

## 2. Architecture

```
                          ┌──────────────────────────────┐
                          │  /api/webhooks/billing (POST) │
                          │  → getBillingProvider().handleWebhook()
                          │     (verifies signature)     │
                          └──────────────┬───────────────┘
                                         │ parsed event
                                         ▼
                          ┌──────────────────────────────┐
                          │  applyBillingEvent()          │  src/lib/billing-webhooks.ts
                          │  idempotent, transactional    │
                          └──────────────┬───────────────┘
                                         ▼
   ┌──────────┐   insert BillingWebhook (unique provider+eventId)   ┌────────────┐
   │ provider │   resolve Plan by providerPlanRef                    │  Plan      │
   │ (stripe/ │   mapProviderStatus(provider, status)                ├────────────┤
   │ paystack)│   reconcile Subscription                             │Subscription│
   └──────────┘   insert BillingEvent (history)                      │ BillingEvent│
                             └────────────────────────────────────── └────────────┘
```

- `src/lib/billing.ts` — provider-agnostic seam. `BillingProvider` interface, registry
  (`registerBillingProvider` / `getBillingProvider`), `NullProvider`, `mapProviderStatus`,
  `getSubscriptionAccess`, price helpers.
- `src/lib/billing-webhooks.ts` — `applyBillingEvent` (transactional, idempotent via the
  unique `(provider, eventId)` key on `BillingWebhook`) and `syncSubscriptionFromProvider`.
- `src/lib/actions/billing.ts` — server actions for school staff: `startSubscriptionCheckout`
  (checkout or plan change), `cancelSubscription` (only marks `cancelAtPeriodEnd` after the
  provider confirms), `refreshSubscriptionFromProvider`.
- `src/app/api/webhooks/billing/route.ts` — inbound webhook endpoint.
- `/settings/billing` — the school-facing billing page (plan, status, usage, plan switcher).
- `/admin/subscriptions` — platform admin read-only list (amount, interval, provider refs).

## 3. State mapping

Provider status → Mazikor `SubStatus` (`mapProviderStatus`):

| Stripe                    | Paystack       | SubStatus  |
| ------------------------- | -------------- | ---------- |
| `trialing`                | `trialing`     | `TRIAL`    |
| `active`                  | `active`       | `ACTIVE`   |
| `past_due`, `unpaid`, `paused` | `paused` | `PAST_DUE` |
| `incomplete`              | —              | `INCOMPLETE` |
| `incomplete_expired`      | `completed`    | `EXPIRED`  |
| `canceled`                | `cancelled`, `non_renewing` | `CANCELLED` |

Special rule in `applyBillingEvent`: a cancelled/non-renewing status **with**
`cancelAtPeriodEnd` and a `currentPeriodEnd` still in the future keeps `ACTIVE`
(`cancelAtPeriodEnd = true`) so access continues to the period end. `endedAt` is set once
the period actually ends.

### Access policy (`getSubscriptionAccess`)

| Status        | Access            |
| ------------- | ----------------- |
| `ACTIVE`, `TRIAL` | full          |
| `PAST_DUE`    | grace for `BILLING_GRACE_PERIOD_DAYS` (default 7) after the missed renewal, then restricted |
| `CANCELLED`   | access until `renewalDate`/period end, then restricted |
| `EXPIRED`     | restricted        |
| `INCOMPLETE`  | restricted (checkout not completed) |

Restricted states surface a banner on the dashboard, settings, and billing pages.

## 4. Checkout flow (target)

1. School admin picks a plan + interval on `/settings/billing`.
2. Server action validates `planId` server-side, reads `providerRef`/`providerYearlyRef`,
   creates/finds the provider customer, creates the provider subscription, creates a hosted
   checkout, and marks the local subscription `INCOMPLETE` (never `ACTIVE`).
3. User completes payment on the provider's hosted page.
4. Provider webhook → `applyBillingEvent` → subscription becomes `ACTIVE`.
5. If the school already has an online subscription, the action calls `changePlan` instead
   (proration handled by the provider); the webhook reconciles.

## 5. What's needed to go live

Fill these in and implement the `BillingProvider` interface for your chosen provider
(follow the reference status maps in §3):

- **Provider choice** — Stripe or Paystack (or another provider supporting hosted
  checkout + subscriptions + webhooks). Register it via `registerBillingProvider("stripe",
  () => stripeProvider)` where the provider module lives at `src/lib/billing/<id>.ts`.
- **Credentials (sandbox first)** — `BILLING_PROVIDER=stripe|paystack`, API secret key,
  and the webhook signing secret. Webhook secret is used in `handleWebhook` to verify the
  `request` signature.
- **Webhook URL** — point the provider's dashboard at
  `https://<your-domain>/api/webhooks/billing` (events: `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`, payment events, etc.).
  The route is unauthenticated (it sits under `/api`, so it passes the auth proxy) and
  relies on signature verification, not sessions.
- **Per-plan provider references** — for every active `Plan`, set `providerRef`
  (monthly price) and `providerYearlyRef` (yearly price) to the provider's plan/price ids.
- **Currency & interval support** — confirm the provider supports MWK (or any other
  currency used by `Plan.currency`) and monthly/yearly billing.
- **Customer portal / self-serve** — decide whether users manage invoices/PCI via the
  provider's portal (recommended; this app never touches card data).
- **Test cards & scenarios** — verify: successful checkout, failed/abandoned checkout
  (`INCOMPLETE`), plan change (upgrade/downgrade), cancel-at-period-end, renewal, past-due
  + grace, expired. See §6.

## 6. Test matrix (when provider is wired)

| Scenario | Expected |
| --- | --- |
| Successful checkout | Webhook → `ACTIVE`, renewal date set |
| Abandoned checkout | Stays `INCOMPLETE`, access restricted |
| Webhook replay / duplicate delivery | Deduplicated, no double records |
| Upgrade plan | `changePlan` confirmed; webhook reconciles plan + price |
| Cancel at period end | Stays `ACTIVE` with `cancelAtPeriodEnd`; ends at period end |
| Renewal payment fails | `PAST_DUE`, grace for 7 days, then restricted |
| Tampered webhook (bad signature) | Rejected, no DB change |

## 7. Manual operations (today, no provider)

While `BILLING_PROVIDER` is unset, platform admins manage subscriptions manually as before
(`/admin/schools/*` and super-admin actions). The billing pages clearly say online billing
is not enabled — no fake checkouts, no fake success.

## 8. Repo pointers

- `prisma/schema.prisma` — `Plan`, `Subscription`, `SubStatus`, `SubInterval`,
  `BillingWebhook`, `BillingEvent`.
- `src/lib/billing.ts` — seam, registry, null provider, status maps, access control.
- `src/lib/billing-webhooks.ts` — idempotent application of webhook events.
- `src/lib/actions/billing.ts` — server actions (honest, provider-confirmed).
- `src/app/api/webhooks/billing/route.ts` — webhook endpoint.
- `src/app/(app)/settings/billing/page.tsx` — school billing page.
- `src/components/billing/*` — plan switcher, cancel form, subscription banner.
- `tests/billing.test.ts` — pure unit tests for mapping, access, price helpers.
