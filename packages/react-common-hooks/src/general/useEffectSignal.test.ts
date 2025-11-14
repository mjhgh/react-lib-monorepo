import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffectSignal } from './useEffectSignal'

describe('useEffectSignal', () => {
  it('provides a non-aborted signal initially and aborts on unmount', () => {
    let lastSignal: AbortSignal | null = null

    const useUnderTest = () => {
      useEffectSignal((signal) => {
        lastSignal = signal
      }, [])
    }

    const { unmount } = renderHook(() => useUnderTest())

    expect(lastSignal).toBeTruthy()
    expect(lastSignal!.aborted).toBe(false)

    unmount()

    expect(lastSignal!.aborted).toBe(true)
  })

  it('aborts previous signal on dependency change and creates a new one', () => {
    const signals: AbortSignal[] = []

    const useWithDep = (value: number) => {
      useEffectSignal((signal) => {
        signals.push(signal)
      }, [value])
    }

    const { rerender } = renderHook(({ value }) => useWithDep(value), {
      initialProps: { value: 0 },
    })

    expect(signals.length).toBe(1)
    expect(signals[0].aborted).toBe(false)

    rerender({ value: 1 })

    expect(signals.length).toBe(2)
    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
  })

  it('invokes abort listeners on unmount', () => {
    const steps: string[] = []

    const useUnderTest = () => {
      useEffectSignal((signal) => {
        steps.push(`start:${signal.aborted}`)
        signal.addEventListener('abort', () => {
          steps.push('aborted')
        })
      }, [])
    }

    const { unmount } = renderHook(() => useUnderTest())
    unmount()

    expect(steps[0]).toBe('start:false')
    expect(steps[1]).toBe('aborted')
  })
})
