import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNamedRefs } from './useNamedRefs'

// Harness that simulates `using refs = useNamedRefs()` by calling [Symbol.dispose]()
const useHarness = (pairs: Array<[string, string]>) => {
  const refs = useNamedRefs()
  for (const [kind, name] of pairs) {
    // touch refs during render
    refs.get(kind, name)
  }
  // simulate end of render scope (like `using` statement)
  refs[Symbol.dispose]()
  return refs
}

describe('useNamedRefs', () => {
  it('returns stable ref identities for same keys across renders', () => {
    const { result, rerender } = renderHook(({ pairs }) => useHarness(pairs), {
      initialProps: { pairs: [['input', 'username']] as Array<[string, string]> },
    })

    const firstRef = result.current.get<HTMLInputElement>('input', 'username')

    // Rerender touching the same key; harness calls dispose each render
    rerender({ pairs: [['input', 'username']] })

    const secondRef = result.current.get<HTMLInputElement>('input', 'username')
    expect(secondRef).toBe(firstRef)
  })

  it('cleans up refs not touched in the new render', () => {
    const { result, rerender } = renderHook(({ pairs }) => useHarness(pairs), {
      initialProps: { pairs: [['input', 'username'], ['btn', 'submit']] as Array<[string, string]> },
    })

    const usernameRef = result.current.get<HTMLInputElement>('input', 'username')

    // Next render: omit 'input:username', keep only 'btn:submit'
    rerender({ pairs: [['btn', 'submit']] })

    // On a subsequent render, accessing the deleted key should create a new ref
    rerender({ pairs: [] })

    const recreated = result.current.get<HTMLInputElement>('input', 'username')
    expect(recreated).not.toBe(usernameRef)
  })
})
