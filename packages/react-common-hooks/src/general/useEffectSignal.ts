import { useEffect, type DependencyList } from 'react'

/**
 * useEffectSignal: like useEffect, but passes an AbortSignal to the effect and
 * automatically aborts it on cleanup (unmount or dependency change).
 */
export function useEffectSignal(
  effect: (signal: AbortSignal) => void,
  deps?: DependencyList
) {
  useEffect(() => {
    const controller = new AbortController()
    effect(controller.signal)
    return () => {
      controller.abort()
    }
  }, deps)
}
