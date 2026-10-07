import { useMemo } from 'react';
import type { IGridReactiveValue, IGridReactiveValueSubscribe } from './IGridReactiveValue.js';

type NoInfer<T> = [T][T extends any ? 0 : never];
export function useCreateGridReactiveValue<T, TArgs extends any[]>(
  get: (...args: TArgs) => T,
  subscribe: NoInfer<IGridReactiveValueSubscribe<TArgs>> | null,
  deps: React.DependencyList,
): IGridReactiveValue<T, TArgs> {
  const value = useMemo<IGridReactiveValue<T, TArgs>>(
    () => ({
      get,
      subscribe: subscribe ?? (() => () => {}),
    }),
    deps,
  );

  return value;
}
