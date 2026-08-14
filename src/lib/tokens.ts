import crypto from "crypto";

/** SHA-256 hex digest used to store invitation token hashes (never the raw token). */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
