import { useSyncExternalStore } from 'react';

function subscribe(): () => void {
  return () => {};
}

/** True only after client hydration. Server and pre-mount client render identically (false). */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
