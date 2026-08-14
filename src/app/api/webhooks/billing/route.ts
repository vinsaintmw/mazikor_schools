import { getBillingProvider } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Inbound webhook endpoint for the configured billing provider.
 *
 * The route itself does nothing but delegate to the provider implementation, which:
 *  1. Verifies the provider's request signature (never trusts the raw payload).
 *  2. Parses the event and calls `applyBillingEvent` (idempotent, transactional).
 *
 * The provider secret keys and webhook signing secrets live only server-side.
 * Returns 501 until `BILLING_PROVIDER` is configured.
 */
export async function POST(request: Request): Promise<Response> {
  return getBillingProvider().handleWebhook(request);
}

export async function GET(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
