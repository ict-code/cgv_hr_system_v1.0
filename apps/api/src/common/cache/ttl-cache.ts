/**
 * Minimal in-process TTL cache. Deliberately not Redis/a shared cache — this
 * app runs a single API instance, and the only candidates using this
 * (Departments/Positions list) are small, rarely-written master-data tables
 * fetched on nearly every page for dropdowns. A single-process cache is the
 * right size for that; reach for something bigger only if this app ever
 * scales to multiple API instances needing a shared cache.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
