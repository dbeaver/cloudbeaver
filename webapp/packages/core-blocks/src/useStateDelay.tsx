/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef, useState } from 'react';

export function useStateDelay(state: boolean, delay: number, callback?: () => void): boolean {
  const [delayedState, setState] = useState(false);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (state === delayedState) {
      return;
    }
    const timerId = setTimeout(() => {
      setState(state);
      if (state) {
        callbackRef.current?.();
      }
    }, delay);

    return () => clearTimeout(timerId);
  }, [state, delayedState, delay]);

  return delayedState;
}
