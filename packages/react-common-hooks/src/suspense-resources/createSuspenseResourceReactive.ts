import { useEffect } from "react";
import { ReactiveMap } from "./ReactiveMap";
import type { SuspenseResult } from "./SuspenseResult";
import type { SuspenseResourceDef } from "./SuspenseResourceDef";
import { useForceUpdate } from "../general/useForceUpdate";
import { useEffectSignal } from "../general/useEffectSignal";

interface SuspenseCacheReactiveHandler<T> {
  use(key: string): T;
  /* 
    This is just a convenience method to delete the cache entry on unmount.
    Please be aware of multiple resources using the same cache, it simply will cause re-fetch.    
   */
  useAndCleanupOnUnmount(key: string): T;
  cache: ReactiveMap<string, SuspenseResult<T>>;

  setResolved(key: string, value: { value: T } | { error: unknown }): void;
}

const sharedCacheMap: Record<
  string,
  ReactiveMap<string, SuspenseResult<any>>
> = {};

export function createSuspenseResourceReactive<T>(
  def: SuspenseResourceDef<T>
): SuspenseCacheReactiveHandler<T> {
  if (!sharedCacheMap[def.name]) {
    sharedCacheMap[def.name] = new ReactiveMap<string, SuspenseResult<T>>();
  }
  const cache = sharedCacheMap[def.name] as ReactiveMap<
    string,
    SuspenseResult<T>
  >;

  function get(key: string): T {
    const entry = cache.get(key);
    if (entry) {
      if ("promise" in entry) {
        throw entry.promise;
      } else if ("error" in entry) {
        throw entry.error;
      } else if ("value" in entry) {
        return entry.value;
      }
    }
    // Not in cache, start loading
    const promise = def
      .resolve(key)
      .then((value) => {
        cache.set(key, { value });
      })
      .catch((error) => {
        cache.set(key, { error });
      });
    cache.set(key, { promise });
    throw promise;
  }

  function use(key: string): T {
    const forceUpdate = useForceUpdate();

    useEffectSignal(
      (signal) => {
        cache.subscribe((info) => {
          // Only force update if this specific key has changed
          if (
            (info.type === "set" ||
              info.type === "update" ||
              info.type === "delete") &&
            info.key === key
          ) {
            forceUpdate();
          } else if (info.type === "clear") {
            forceUpdate();
          }
        }, signal);
      },
      [key]
    );

    return get(key);
  }

  function useAndCleanupOnUnmount(key: string): T {
    const result = use(key);

    useEffect(() => {
      return () => {
        cache.delete(key);
      };
    }, [key]);

    return result;
  }

  function setResolved(
    key: string,
    value: { value: T } | { error: unknown }
  ): void {
    cache.set(key, value as SuspenseResult<T>);
  }

  return { use, useAndCleanupOnUnmount, cache, setResolved };
}
