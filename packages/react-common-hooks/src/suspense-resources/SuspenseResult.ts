export type SuspenseResult<T> =
  | { promise: Promise<void> }
  | { error: unknown }
  | { value: T };
