/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';
import { getCellLookupPoint } from './helpers/getCellLookupPoint.js';
import { getEdgeSpeed } from './helpers/getEdgeSpeed.js';

export interface IMousePosition {
  x: number;
  y: number;
}

export interface IGridAutoScroll {
  update: (container: HTMLElement, cursor: IMousePosition) => void;
  stop: () => void;
}

interface IGridAutoScrollController extends IGridAutoScroll {
  setOnScroll: (onScroll: (cellLookupPoint: IMousePosition) => void) => void;
}

function createGridAutoScrollController(): IGridAutoScrollController {
  let onScroll: ((cellLookupPoint: IMousePosition) => void) | null = null;
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

    const body = {
      left: rect.left,
      top: headerRow ? headerRow.getBoundingClientRect().bottom : rect.top,
      right: rect.right,
      bottom: rect.bottom,
    };

    onScroll?.(getCellLookupPoint(cursor, body));

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

  function setOnScroll(nextOnScroll: (cellLookupPoint: IMousePosition) => void): void {
    onScroll = nextOnScroll;
  }

  return { update, stop, setOnScroll };
}

export function useGridAutoScroll(onScroll: (cellLookupPoint: IMousePosition) => void): IGridAutoScroll {
  const [controller] = useState(createGridAutoScrollController);

  // the scroll loop runs outside React (requestAnimationFrame), so keep its callback in sync from an effect
  useEffect(() => {
    controller.setOnScroll(onScroll);
  }, [controller, onScroll]);

  useEffect(() => controller.stop, [controller]);

  return controller;
}
