/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useRef, useState } from 'react';

interface UseHoverResult<T extends HTMLElement> {
  ref: React.RefCallback<T>;
  isHovered: boolean;
}

export function useHover<T extends HTMLElement = HTMLElement>(): UseHoverResult<T> {
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<T | null>(null);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

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
