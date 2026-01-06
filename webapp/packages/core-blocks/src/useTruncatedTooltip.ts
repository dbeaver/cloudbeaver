/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef, useState } from 'react';

import { useTranslate } from './localization/useTranslate.js';

export function useTruncatedTooltip(ref: React.RefObject<HTMLDivElement | null>, tooltip: string | undefined): string | undefined {
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const translate = useTranslate();
  const observerRef = useRef<ResizeObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  function checkTruncation() {
    if (elementRef.current) {
      setIsTextTruncated(elementRef.current.scrollWidth > elementRef.current.clientWidth);
    }
  }

  useEffect(() => {
    const element = ref.current;

    if (elementRef.current === element) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = element;

    if (!element) {
      return;
    }

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    resizeObserver.observe(element);
    observerRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();
    };
  });

  const translatedTooltip = tooltip ? translate(tooltip) : undefined;

  if (isTextTruncated && translatedTooltip) {
    return translatedTooltip;
  }

  return;
}
