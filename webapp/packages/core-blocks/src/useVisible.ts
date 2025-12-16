/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useRef, useSyncExternalStore } from 'react';

interface UseVisibleResult {
  isVisible: boolean;
  setRef: (node: HTMLDivElement | null) => void;
}

export function useVisible(): UseVisibleResult {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    observerRef.current = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.target === elementRef.current) {
            const newValue = entry.isIntersecting;
            if (isVisibleRef.current !== newValue) {
              isVisibleRef.current = newValue;
              onStoreChange();
            }
          }
        }
      },
      { threshold: 0 },
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const getSnapshot = useCallback(() => isVisibleRef.current, []);

  const isVisible = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (elementRef.current) {
      observerRef.current?.unobserve(elementRef.current);
    }

    elementRef.current = node;

    if (elementRef.current) {
      observerRef.current?.observe(elementRef.current);
    }
  }, []);

  return { isVisible, setRef };
}
