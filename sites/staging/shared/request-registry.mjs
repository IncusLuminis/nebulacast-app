/** Location keyed request de-duplication with cancellation and bounded freshness. */
export function normalizeLocation(location) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return null;
  const tz = typeof location.tz === "string" ? location.tz : "";
  return `${location.lat.toFixed(4)},${location.lon.toFixed(4)},${tz}`;
}

export class RequestRegistry {
  constructor({ ttlMs = 5 * 60_000 } = {}) {
    this.ttlMs = ttlMs;
    this.entries = new Map();
  }

  getOrCreate(key, factory) {
    const now = Date.now();
    const current = this.entries.get(key);
    if (current && (current.value || now - current.startedAt < this.ttlMs)) return current.promise;
    current?.controller.abort();
    const controller = new AbortController();
    const entry = { controller, startedAt: now, value: null, promise: null };
    entry.promise = Promise.resolve().then(() => factory(controller.signal)).then(value => {
      if (this.entries.get(key) === entry) entry.value = value;
      return value;
    }).finally(() => {
      if (this.entries.get(key) === entry && entry.value === null) this.entries.delete(key);
    });
    this.entries.set(key, entry);
    return entry.promise;
  }

  cancelExcept(key) {
    for (const [entryKey, entry] of this.entries) {
      if (entryKey !== key) {
        entry.controller.abort();
        this.entries.delete(entryKey);
      }
    }
  }

  clear() {
    for (const entry of this.entries.values()) entry.controller.abort();
    this.entries.clear();
  }
}
