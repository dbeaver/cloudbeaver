import { useMemo, useSyncExternalStore } from 'react';
import type { IGridReactiveValue } from './IGridReactiveValue.js';

export function useGridReactiveValue<P extends IGridReactiveValue<any, any[]> | undefined>(
  value: P,
  ...args: P extends IGridReactiveValue<any, infer T> ? T : never[]
): P extends IGridReactiveValue<infer T, any[]> ? T : undefined {
  const mappedValue = useMemo(
    () => ({
      cache: null as any,
      cacheInvalidated: true,
      subscribe: (onValueChange: () => void) => {
        if (value) {
          return value.subscribe(
            () => {
              mappedValue.cacheInvalidated = true;
              return onValueChange();
            },
            ...args,
          );
        }

        return () => {};
      },
      get: () => {
        if (mappedValue.cacheInvalidated) {
          mappedValue.cache = value?.get(...args);
          mappedValue.cacheInvalidated = false;
        }
        return mappedValue.cache;
      },
    }),
    [value, ...args],
  );
  return useSyncExternalStore(mappedValue.subscribe, mappedValue.get);
}
