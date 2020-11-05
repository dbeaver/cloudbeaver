/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
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
    if (!state) {
      return;
    }
    const timerId = setTimeout(() => {
      setState(true);
      callbackRef.current?.();
    }, delay);

    return () => clearTimeout(timerId);
  }, [state, delay]);

  return delayedState;
}
