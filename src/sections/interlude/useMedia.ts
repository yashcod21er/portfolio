import { useCallback, useSyncExternalStore } from 'react';

export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
export const MOBILE_QUERY = '(max-width: 767px)';
export const FINE_QUERY = '(hover: hover) and (pointer: fine)';

/** Live matchMedia subscription (false on the server snapshot). */
export function useMedia(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
