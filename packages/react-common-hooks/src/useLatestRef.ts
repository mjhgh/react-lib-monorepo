import { useRef } from 'react';

/**
 * useLatestRef returns a ref object whose `.current` property is updated to the latest value on every render.
 *
 * @template T
 * @param {T} value - The value to keep updated in the ref.
 * @returns {React.RefObject<T>}
 */
export function useLatestRef<T>(value: T): React.RefObject<T> {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
}
