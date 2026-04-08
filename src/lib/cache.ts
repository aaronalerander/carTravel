interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();

  constructor(
    private ttlMs: number,
    private maxSize: number
  ) {}

  get(key: K): V | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  size(): number {
    return this.store.size;
  }
}

import type { FlightOffer, TuroListing } from "@/types";

export const flightCache = new TTLCache<string, FlightOffer | null>(
  60 * 60 * 1000, // 1 hour
  500
);

export const turoCache = new TTLCache<string, TuroListing[]>(
  30 * 60 * 1000, // 30 minutes
  200
);
