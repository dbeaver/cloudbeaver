/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { startTransition, useCallback, useRef, useState } from 'react';

interface UseHoverResult<T extends HTMLElement> {
  ref: React.RefCallback<T>;
  isHovered: boolean;
  hoverIn: () => void;
  hoverOut: () => void;
}

export function useHover<T extends HTMLElement = HTMLElement>(): UseHoverResult<T> {
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<T | null>(null);

  const hoverIn = useCallback(() => {
    startTransition(() => {
      setIsHovered(true);
    });
  }, []);

  const hoverOut = useCallback(() => {
    startTransition(() => {
      setIsHovered(false);
    });
  }, []);

  const ref = useCallback(
    (node: T | null) => {
      if (nodeRef.current) {
        nodeRef.current.removeEventListener('mouseenter', hoverIn);
        nodeRef.current.removeEventListener('mouseleave', hoverOut);
      }

      nodeRef.current = node;

      if (node) {
        node.addEventListener('mouseenter', hoverIn);
        node.addEventListener('mouseleave', hoverOut);
      }
    },
    [hoverIn, hoverOut],
  );

  return { ref, isHovered, hoverIn, hoverOut };
}
