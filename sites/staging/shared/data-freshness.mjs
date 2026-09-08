const DEFAULT_MAX_AGE_MS = 36 * 60 * 60 * 1000;
export function classifyDataFreshness(data, now = Date.now(), maxAgeMs = DEFAULT_MAX_AGE_MS) {
  if (!data || typeof data !== "object") return { status: "unavailable", ageMs: null };
  const raw = data.manifest?.generated_utc || data.generated_utc || data.generated_at || data.updated_utc;
  const timestamp = raw ? Date.parse(raw) : NaN;
  if (!Number.isFinite(timestamp)) return { status: "unavailable", ageMs: null };
  const ageMs = Math.max(0, now - timestamp);
  return { status: ageMs > maxAgeMs ? "stale" : "fresh", ageMs, timestamp };
}
export function formatFreshnessLabel({ status }) {
  return status === "fresh" ? "Fresh" : status === "stale" ? "Stale data" : "Unavailable";
}
