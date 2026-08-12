/**
 * Prisma returns Decimal and Date objects that are not serializable to the
 * client. These helpers convert a record tree into plain JSON-friendly values.
 */
export function num(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === "object" && "toNumber" in (value as object)
    ? (value as { toNumber(): number }).toNumber()
    : typeof value === "string"
      ? parseFloat(value)
      : (value as number);
  return Number.isFinite(n) ? n : 0;
}

export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
