import { useReducer } from "react";

export function useForceUpdate(): () => void {
  const [, forceUpdate] = useReducer((prevState) => !prevState, false);
  return forceUpdate;
}
