/**
 * In-process cache for expensive read-only aggregations. Safe because the app opens the
 * database read-only and the file never changes while the server runs (see ADs/imutabilidade.md);
 * restarting the server after rebuilding the database clears it.
 */
const MAX_ENTRIES = 300;

export function memo<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const cache = new Map<string, R>();
  return (...args: A): R => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      const hit = cache.get(key) as R;
      // refresh LRU position
      cache.delete(key);
      cache.set(key, hit);
      return hit;
    }
    const value = fn(...args);
    cache.set(key, value);
    if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    return value;
  };
}
