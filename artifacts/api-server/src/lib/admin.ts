/** Server-owned allowlist. Never use browser state or editable user metadata. */
export function isAdmin(
  userId: string | undefined,
  configured = process.env.ADMIN_USER_IDS,
): boolean {
  return (
    !!userId &&
    (configured ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(userId)
  );
}

export function parsePage(value: unknown): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 100_000 ? page : null;
}
