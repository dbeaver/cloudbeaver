/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/* eslint-disable react-hooks/refs */

import { useMemo, useRef } from 'react';

type TDebouncedCallback<Params extends unknown[]> = ((...args: Params) => void) & {
  cancel: () => void;
};

export function useDebounceCallback<Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number,
): TDebouncedCallback<Params> {
  const internalCallbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(delay);

  internalCallbackRef.current = callback;
  delayRef.current = delay;

  const debounced = useMemo(() => {
    const cancel = () => {
      if (!timerRef.current) {
        return;
      }

      clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const debouncedCallback = (...args: Params) => {
      cancel();
      timerRef.current = setTimeout(() => {
        internalCallbackRef.current(...args);
      }, delayRef.current);
    };

    debouncedCallback.cancel = cancel;

    return debouncedCallback;
  }, []);

  return debounced;
}
