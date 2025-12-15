/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef, useState } from 'react';

interface IPendingState {
  timeout: ReturnType<typeof setTimeout> | null;
  state: boolean;
}

export function useStateDelay(state: boolean, delay: number, callback?: () => void): boolean {
  const [delayedState, setState] = useState(state);
  const callbackRef = useRef(callback);
  const actualStateRef = useRef<IPendingState | null>(null);

  callbackRef.current = callback;

  useEffect(() => {
    if (delayedState === state) {
      if (actualStateRef.current) {
        if (actualStateRef.current.timeout !== null) {
          clearTimeout(actualStateRef.current.timeout);
        }
        actualStateRef.current = null;
      }
      return;
    }

    if (actualStateRef.current?.state !== state) {
      if (actualStateRef.current && actualStateRef.current.timeout !== null) {
        clearTimeout(actualStateRef.current.timeout);
      }

      actualStateRef.current = {
        timeout: setTimeout(() => {
          setState(state);
          actualStateRef.current = null;
        }, delay),
        state,
      };
    }
  });

  useEffect(() => {
    if (delayedState) {
      callbackRef.current?.();
    }
  }, [delayedState]);

  return delayedState;
}
