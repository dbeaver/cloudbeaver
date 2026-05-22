/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef, useState } from 'react';
import { clamp } from '@dbeaver/js-helpers';
import { getEdgeSpeed } from './helpers/getEdgeSpeed.js';

export interface IMousePosition {
  x: number;
  y: number;
}

export interface IGridAutoScroll {
  update: (container: HTMLElement, cursor: IMousePosition) => void;
  stop: () => void;
}

const LOOKUP_INSET = 16;

export function useGridAutoScroll(onScroll: (cellLookupPoint: IMousePosition) => void): IGridAutoScroll {
  const onScrollRef = useRef(onScroll);
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  const [controller] = useState<IGridAutoScroll>(() => {
    let container: HTMLElement | null = null;
    let headerRow: Element | null = null;
    let cursor: IMousePosition | null = null;
    let frameId: number | null = null;

    function step(): void {
      frameId = null;

      if (!container || !cursor) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const speedX = getEdgeSpeed(cursor.x, rect.left, rect.right);
      const speedY = getEdgeSpeed(cursor.y, rect.top, rect.bottom);

      // cursor is back inside the inner area — pause until the next update()
      if (speedX === 0 && speedY === 0) {
        return;
      }

      const scrollLeftBefore = container.scrollLeft;
      const scrollTopBefore = container.scrollTop;

      container.scrollLeft += speedX;
      container.scrollTop += speedY;

      if (container.scrollLeft === scrollLeftBefore && container.scrollTop === scrollTopBefore) {
        return;
      }

      const bodyTop = headerRow ? headerRow.getBoundingClientRect().bottom : rect.top;

      onScrollRef.current({
        x: clamp(cursor.x, rect.left + LOOKUP_INSET, rect.right - LOOKUP_INSET),
        y: clamp(cursor.y, bodyTop + LOOKUP_INSET, rect.bottom - LOOKUP_INSET),
      });

      frameId = requestAnimationFrame(step);
    }

    function stop(): void {
      container = null;
      headerRow = null;
      cursor = null;

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    }

    function update(nextContainer: HTMLElement, nextCursor: IMousePosition): void {
      if (nextContainer !== container) {
        container = nextContainer;
        headerRow = nextContainer.querySelector('.rdg-header-row');
      }
      cursor = nextCursor;

      if (frameId === null) {
        frameId = requestAnimationFrame(step);
      }
    }

    return { update, stop };
  });

  useEffect(() => controller.stop, [controller]);

  return controller;
}
