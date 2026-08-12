/**
 * SMS provider abstraction.
 *
 * No SMS is ever sent unless a real provider is configured. This module exposes
 * a clean interface so Malawi providers (Airtel Money, TNM Mpamba) can be
 * wired in later without touching business logic.
 */

export interface SmsProvider {
  name: string;
  configured: boolean;
  send(to: string, message: string, opts?: Record<string, unknown>): Promise<{ ok: boolean; error?: string }>;
}

class NoopProvider implements SmsProvider {
  name = "none";
  configured = false;
  async send(_to: string, _message: string) {
    return { ok: false, error: "No SMS provider is configured." };
  }
}

// Future: implement AirtelSmsProvider, MpambaSmsProvider here and select via env var.
const providers: Record<string, SmsProvider> = {
  none: new NoopProvider(),
};

export function getSmsProvider(): SmsProvider {
  const name = process.env.SMS_PROVIDER ?? "none";
  return providers[name] ?? providers.none;
}

export async function sendSms(input: {
  to: string;
  message: string;
  purpose: "fee_reminder" | "attendance_alert" | "exam_results" | "announcement";
}) {
  const provider = getSmsProvider();
  if (!provider.configured) {
    // Record intent in the audit log instead of pretending to send.
    return { ok: false, error: "No SMS provider configured.", queued: false };
  }
  return provider.send(input.to, input.message, { purpose: input.purpose });
}
