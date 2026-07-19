import { createHash, randomUUID } from "node:crypto";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createContentHash(input: unknown): string {
  return sha256(stableStringify(input));
}

export function createIdempotencyKey(parts: Array<string | number | Date | null | undefined>): string {
  const clean = parts.map((part) => {
    if (part instanceof Date) return part.toISOString();
    return part == null ? "" : String(part);
  });
  return sha256(clean.join(":"));
}

export function createRunId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
