/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';

/**
 * Calls {@link onLeave} when the referenced element leaves the visible area of the viewport.
 *
 * Uses IntersectionObserver so it works both when the element is scrolled out of view
 * and when it is removed from the DOM entirely (the observer fires with isIntersecting=false
 * in both cases).
 *
 * Returns a ref that must be attached to the target element.
 */
export function useViewLeave<T extends HTMLElement>(onLeave: () => void): React.RefObject<T | null> {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry!.isIntersecting) {
          onLeave();
        }
      },
      { threshold: 0 },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  });

  return elementRef;
}
