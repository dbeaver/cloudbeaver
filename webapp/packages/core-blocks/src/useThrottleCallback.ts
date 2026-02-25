import { useMemo, useRef } from 'react';

type TThrottledCallback<Params extends unknown[]> = ((...args: Params) => void) & {
  cancel: () => void;
};

export const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number,
): TThrottledCallback<Params> => {
  const internalCallbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCalledRef = useRef(false);
  const delayRef = useRef(delay);
  const lastArgsRef = useRef<Params | null>(null);

  internalCallbackRef.current = callback;
  delayRef.current = delay;

  const throttled = useMemo(() => {
    const timer = () => {
      isCalledRef.current = false;

      if (!lastArgsRef.current) {
        return;
      }

      internalCallbackRef.current.apply(this, lastArgsRef.current);
      lastArgsRef.current = null;
      setTimeout(timer, delayRef.current);
    };

    const cancel = () => {
      if (!timeoutRef.current) {
        return;
      }

      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      isCalledRef.current = false;
    };

    const throttledCallback = (...args: Params) => {
      lastArgsRef.current = args;
      if (isCalledRef.current) {
        return;
      }

      internalCallbackRef.current.apply(this, args);
      isCalledRef.current = true;
      timeoutRef.current = setTimeout(timer, delayRef.current);
    };

    throttledCallback.cancel = cancel;

    cancel();
    return throttledCallback;
  }, [delay]);

  return throttled;
};
