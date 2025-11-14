import { useRef } from "react";

/**
 * useOnce hook returns a stable ref object whose `.current` property is initialized to the provided value only once.
 *
 * @template T
 * @param {T} initialValue - The initial value for the ref.
 * @returns {React.MutableRefObject<T>}
 */
export function useOnce<T>(once: () => T): T {
  const ref = useRef<[T] | undefined>(undefined);
  if (ref.current === undefined) {
    ref.current = [once()];
  }
  return ref.current[0];
}
