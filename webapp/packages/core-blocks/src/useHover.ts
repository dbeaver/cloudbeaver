/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useRef, useState } from 'react';
import { useThrottleCallback } from './useThrottleCallback.js';

interface UseHoverResult<T extends HTMLElement> {
  ref: React.RefCallback<T>;
  isHovered: boolean;
}

export function useHover<T extends HTMLElement = HTMLElement>(): UseHoverResult<T> {
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<T | null>(null);

  const handleMove = useThrottleCallback((value: boolean) => {
    setIsHovered(value);
  }, 100);

  const handleMouseEnter = useCallback(() => {
    handleMove(true);
  }, [handleMove]);

  const handleMouseLeave = useCallback(() => {
    handleMove(false);
  }, [handleMove]);

  const ref = useCallback(
    (node: T | null) => {
      if (nodeRef.current) {
        nodeRef.current.removeEventListener('mouseenter', handleMouseEnter);
        nodeRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }

      nodeRef.current = node;

      if (node) {
        node.addEventListener('mouseenter', handleMouseEnter);
        node.addEventListener('mouseleave', handleMouseLeave);
      }
    },
    [handleMouseEnter, handleMouseLeave],
  );

  return { ref, isHovered };
}
