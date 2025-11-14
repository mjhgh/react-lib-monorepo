import type { RefObject } from "react";
import { useLayoutEffect, useRef } from "react";

/**
 * useNamedRefs
 *
 * Returns an object with:
 * - get<T>(kind, name): RefObject<T | null>
 * - [Symbol.dispose](): void — marks the end of the render scope
 *
 * Design:
 * - Tracks refs by (kind,name) and marks keys touched during a render.
 * - [Symbol.dispose]() snapshots the touched keys for this render only.
 * - Actual deletions (keys not touched this render) happen after commit in a layout effect,
 *   which is safe in Strict/Concurrent modes.
 *
 * Usage (with the JS `using` statement):
 *   using refs = useNamedRefs()
 *   const inputRef = refs.get<HTMLInputElement>('input', 'username')
 *
 * Requirements:
 * - TypeScript >= 5.2 and tsconfig lib includes ESNext.Disposable (or ESNext).
 */
export function useNamedRefs() {
  type Key = string;
  const makeKey = (kind: string, name: string): Key => `${kind}:${name}`;

  // kind -> name -> ref
  const byKindRef = useRef(
    new Map<string, Map<string, RefObject<any>>>()
  );

  // Previous committed set of keys
  const prevKeysRef = useRef<Set<Key>>(new Set());

  // Pending snapshot produced by [Symbol.dispose]() for current render
  const pendingRef = useRef<{ renderId: number; keys: Set<Key> } | null>(null);

  // Monotonic render counter to correlate disposal with the right render
  const renderIdRef = useRef(0);
  const thisRenderId = ++renderIdRef.current;

  // Touched keys for this render
  const touchedThisRender = new Set<Key>();

  const get = <T>(kind: string, name: string): RefObject<T | null> => {
    const key = makeKey(kind, name);
    touchedThisRender.add(key);

    let inner = byKindRef.current.get(kind);
    if (!inner) {
      inner = new Map();
      byKindRef.current.set(kind, inner);
    }

    let ref = inner.get(name) as RefObject<T | null> | undefined;
    if (!ref) {
      ref = { current: null };
      inner.set(name, ref as RefObject<any>);
    }

    return ref;
  };

  // Defer destructive work until after commit
  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.renderId !== renderIdRef.current) return;

    const nextKeys = pending.keys;

    // Delete keys that were present previously but not touched this render
    for (const key of prevKeysRef.current) {
      if (!nextKeys.has(key)) {
        // parse kind:name
        const idx = key.indexOf(":");
        const kind = key.slice(0, idx);
        const name = key.slice(idx + 1);
        const inner = byKindRef.current.get(kind);
        if (inner) {
          inner.delete(name);
          if (inner.size === 0) byKindRef.current.delete(kind);
        }
      }
    }

    // Update prev snapshot
    prevKeysRef.current = nextKeys;

    // Clear pending; it's been applied for this commit
    pendingRef.current = null;
  });

  const api = {
    get,
    [Symbol.dispose]: () => {
      // Only snapshot; no destructive work in render
      pendingRef.current = {
        renderId: thisRenderId,
        keys: new Set(touchedThisRender),
      };
    },
  };

  return api;
}
