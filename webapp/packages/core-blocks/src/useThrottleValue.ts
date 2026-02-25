import { useEffect, useRef, useState } from 'react';

import { useThrottleCallback } from './useThrottleCallback.js';

export function useThrottleValue<Value>(value: Value, delay: number) {
  const previousValueRef = useRef(value);
  const [throttledValue, setThrottledValue] = useState(value);

  const throttledSetState = useThrottleCallback(setThrottledValue, delay);

  useEffect(() => {
    if (previousValueRef.current === value) {
      return;
    }

    throttledSetState(value);
    previousValueRef.current = value;
  }, [value]);

  return throttledValue;
}
