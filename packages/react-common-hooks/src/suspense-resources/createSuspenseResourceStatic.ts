import type { SuspenseResourceDef } from "./SuspenseResourceDef";
import type { SuspenseResult } from "./SuspenseResult";

const sharedCacheMap: Record<string, Record<string, SuspenseResult<any>>> = {};

interface SuspenseCacheHandler<T> {
  get(key: string): T;
  cache: Record<string, SuspenseResult<T>>;
}

export function createSuspenseResourceStatic<T>(
  def: SuspenseResourceDef<T>
): SuspenseCacheHandler<T> {
  if (!sharedCacheMap[def.name]) {
    sharedCacheMap[def.name] = {};
  }
  const cache = sharedCacheMap[def.name];

  function get(key: string): T {
    const entry = cache[key];
    if (entry) {
      if ("promise" in entry) {
        throw entry.promise;
      } else if ("error" in entry) {
        throw entry.error;
      } else if ("value" in entry) {
        return entry.value as T;
      }
    }
    // Not in cache, start loading
    const promise = def.resolve(key).then(
      (value) => {
        cache[key] = { value };
      },
      (error) => {
        cache[key] = { error };
      }
    );

    cache[key] = { promise };
    throw promise;
  }

  return { get, cache };
}
