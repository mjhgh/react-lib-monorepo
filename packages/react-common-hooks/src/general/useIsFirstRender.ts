import { useRef } from "react";

export function useIsFirstRender(): boolean {
  const ref = useRef<boolean>(null);
  if (ref.current === null) {
    ref.current = true;
    return true;
  }
  return false;
}
