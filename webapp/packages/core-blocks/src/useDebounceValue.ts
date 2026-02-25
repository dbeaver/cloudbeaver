/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef, useState } from 'react';

import { useDebounceCallback } from './useDebounceCallback.js';

export function useDebounceValue<Value>(value: Value, delay: number): Value {
  const previousValueRef = useRef(value);
  const [debouncedValue, setDebounceValue] = useState(value);

  const setState = useDebounceCallback(setDebounceValue, delay);

  useEffect(() => {
    if (previousValueRef.current === value) {
      return;
    }

    setState(value);

    previousValueRef.current = value;
  }, [value, setState]);

  return debouncedValue;
}
