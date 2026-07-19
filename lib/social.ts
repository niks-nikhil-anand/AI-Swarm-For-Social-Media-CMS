export const SOCIAL_PLATFORMS = ["LinkedIn", "X"] as const;
export type SocialPlatformName = (typeof SOCIAL_PLATFORMS)[number];

export const CONTENT_DRAFT_STATUSES = [
  "Draft",
  "InReview",
  "NeedsApproval",
  "Approved",
  "ChangesRequested",
  "Rejected",
  "Scheduled",
  "Published",
  "Failed",
] as const;

export const APPROVAL_STATUSES = ["Pending", "Approved", "ChangesRequested", "Rejected", "Expired"] as const;
export const PUBLISH_STATUSES = ["Queued", "Scheduled", "Publishing", "Published", "Failed", "Cancelled"] as const;
export const FACT_CHECK_STATUSES = ["Verified", "NeedsReview", "Unsupported", "Outdated", "ConflictingSources"] as const;
export const SIGNAL_SOURCE_TYPES = ["SearXNG", "X", "LinkedIn", "Reddit", "YouTube", "News", "Competitor", "Website"] as const;

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const DEFAULT_POSTS_PER_DAY = 3;

export const DEFAULT_DAILY_SLOTS = [
  { key: "morning", label: "Morning", time: "09:15" },
  { key: "afternoon", label: "Afternoon", time: "13:30" },
  { key: "evening", label: "Evening", time: "18:45" },
] as const;

export function isSocialPlatform(value: unknown): value is SocialPlatformName {
  return typeof value === "string" && SOCIAL_PLATFORMS.includes(value as SocialPlatformName);
}

export function normalizePlatform(value: string): SocialPlatformName | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "linkedin" || normalized === "linked-in") return "LinkedIn";
  if (normalized === "x" || normalized === "twitter" || normalized === "x/twitter") return "X";
  return null;
}

export function requiresApproval(status: string | null | undefined): boolean {
  return status !== "Approved";
}
