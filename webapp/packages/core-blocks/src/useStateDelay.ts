/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef, useState } from 'react';

export function useStateDelay(state: boolean, delay: number, callback?: () => void): boolean {
  const [delayedState, setState] = useState(state);
  const callbackRef = useRef(callback);
  const actualStateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  callbackRef.current = callback;

  useEffect(() => {
    if (state === delayedState) {
      if (actualStateRef.current !== null) {
        clearTimeout(actualStateRef.current);
        actualStateRef.current = null;
      }
      return;
    }

    if (actualStateRef.current !== null) {
      return;
    }

    actualStateRef.current = setTimeout(() => {
      setState(state);
      actualStateRef.current = null;
    }, delay);
  });

  useEffect(() => {
    if (delayedState) {
      callbackRef.current?.();
    }
  }, [delayedState]);

  return delayedState;
}
