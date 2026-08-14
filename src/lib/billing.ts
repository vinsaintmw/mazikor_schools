/**
 * Billing abstraction — a clean seam for future payment providers.
 *
 * Payment processing is intentionally NOT faked. Until a real provider is
 * wired up (via `BILLING_PROVIDER`), `getBillingProvider()` returns `null`
 * and subscriptions are managed manually by platform administrators.
 */

export interface CheckoutParams {
  subscriptionId: string;
  planId: string;
  schoolId: string;
  interval: "monthly" | "yearly";
  returnUrl: string;
}

export interface CheckoutResult {
  url: string;
  reference: string;
}

export interface BillingProvider {
  readonly id: string;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  cancelSubscription(reference: string): Promise<{ ok: boolean }>;
  handleWebhook(request: Request): Promise<Response>;
}

class NullProvider implements BillingProvider {
  readonly id = "none";

  async createCheckout(): Promise<CheckoutResult> {
    throw new Error("No billing provider is configured. Set BILLING_PROVIDER to enable payments.");
  }

  async cancelSubscription(): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async handleWebhook(): Promise<Response> {
    return new Response("Not configured", { status: 501 });
  }
}

const providers = new Map<string, () => BillingProvider>();
const nullProvider = new NullProvider();

export function registerBillingProvider(id: string, factory: () => BillingProvider): void {
  providers.set(id, factory);
}

export function getBillingProvider(): BillingProvider {
  const configured = process.env.BILLING_PROVIDER;
  const factory = configured ? providers.get(configured) : null;
  return factory ? factory() : nullProvider;
}
