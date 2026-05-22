/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useEffect, useRef } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import { type IMousePosition, useGridAutoScroll } from './useGridAutoScroll.js';

export interface IDraggingPosition {
  rowIdx: number;
  colIdx: number;
}

type DraggingMouseEvent = React.MouseEvent<HTMLDivElement> | MouseEvent;

type DraggingCallback = (startPosition: IDraggingPosition, currentPosition: IDraggingPosition, event: DraggingMouseEvent) => void;

interface IDraggingState {
  startDraggingCell: IDraggingPosition | null;
  currentDraggingCell: IDraggingPosition | null;
  startMousePosition: IMousePosition | null;
  /** Last mouse event, reused to keep modifier keys (ctrl/meta) available while auto-scrolling */
  lastEvent: DraggingMouseEvent | null;
  scrollContainer: HTMLElement | null;
  dragging: boolean;
  mouseDown: boolean;
}

interface IDraggingCallbacks {
  onDragStart?: (startPosition: IDraggingPosition, event: DraggingMouseEvent) => void;
  onDragOver?: DraggingCallback;
  onDragEnd?: DraggingCallback;
}

interface IGridDragging {
  onMouseDownHandler: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMoveHandler: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const THRESHOLD = 10;

function getDelta(startPosition: IMousePosition | null, currentPosition: IMousePosition | null) {
  if (!startPosition || !currentPosition) {
    return null;
  }

  const xDelta = Math.abs(startPosition.x - currentPosition.x);
  const yDelta = Math.abs(startPosition.y - currentPosition.y);

  return Math.max(xDelta, yDelta);
}

function getCellPositionFromElement(element: Element | null): IDraggingPosition | undefined {
  const cell = element?.closest('[role="gridcell"]');

  if (!cell) {
    return undefined;
  }

  const rowIdx = cell.getAttribute('data-row-index');
  const columnIdx = cell.getAttribute('data-column-index');

  if (!rowIdx || !columnIdx) {
    return undefined;
  }

  return {
    rowIdx: Number(rowIdx),
    colIdx: Number(columnIdx),
  };
}

function isDraggingStarted(delta: number | null, threshold: number) {
  if (delta === null) {
    return false;
  }

  return delta > threshold;
}

export function useGridDragging(props: IDraggingCallbacks): IGridDragging {
  const callbacks = useObjectRef(props);

  const state = useRef<IDraggingState>({
    startDraggingCell: null,
    currentDraggingCell: null,
    startMousePosition: null,
    lastEvent: null,
    scrollContainer: null,
    dragging: false,
    mouseDown: false,
  });

  const dragOver = useCallback(
    (position: IDraggingPosition, event: DraggingMouseEvent): void => {
      const { startDraggingCell, currentDraggingCell } = state.current;

      if (!startDraggingCell || (position.rowIdx === currentDraggingCell?.rowIdx && position.colIdx === currentDraggingCell.colIdx)) {
        return;
      }

      state.current.currentDraggingCell = position;
      callbacks.onDragOver?.(startDraggingCell, position, event);
    },
    [callbacks],
  );

  const autoScroll = useGridAutoScroll(
    useCallback(
      (cellLookupPoint: IMousePosition): void => {
        const position = getCellPositionFromElement(document.elementFromPoint(cellLookupPoint.x, cellLookupPoint.y));

        if (position && state.current.lastEvent) {
          dragOver(position, state.current.lastEvent);
        }
      },
      [dragOver],
    ),
  );

  const onMouseDownHandler = useCallback((event: React.MouseEvent<HTMLDivElement>): void => {
    const position = getCellPositionFromElement(event.target as Element);

    if (!position) {
      return;
    }

    state.current.mouseDown = true;
    state.current.startMousePosition = { x: event.pageX, y: event.pageY };
    state.current.startDraggingCell = position;
    state.current.scrollContainer = event.currentTarget.querySelector<HTMLElement>('[role="grid"]');
  }, []);

  const onMouseMoveHandler = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (!state.current.mouseDown) {
        return;
      }

      if (!state.current.dragging) {
        const delta = getDelta(state.current.startMousePosition, { x: event.pageX, y: event.pageY });

        if (!isDraggingStarted(delta, THRESHOLD)) {
          return;
        }

        if (state.current.startDraggingCell) {
          callbacks.onDragStart?.(state.current.startDraggingCell, event);
        }

        state.current.dragging = true;
        return;
      }

      state.current.lastEvent = event;

      const position = getCellPositionFromElement(event.target as Element);

      if (position) {
        dragOver(position, event);
      }

      if (state.current.scrollContainer) {
        autoScroll.update(state.current.scrollContainer, { x: event.clientX, y: event.clientY });
      }
    },
    [callbacks, dragOver, autoScroll],
  );

  const onMouseUpHandler = useCallback(
    (event: DraggingMouseEvent): void => {
      autoScroll.stop();

      const { dragging, startDraggingCell, currentDraggingCell } = state.current;

      if (dragging && startDraggingCell && currentDraggingCell) {
        callbacks.onDragEnd?.(startDraggingCell, currentDraggingCell, event);
      }

      state.current.mouseDown = false;
      state.current.dragging = false;
      state.current.startMousePosition = null;
      state.current.startDraggingCell = null;
      state.current.currentDraggingCell = null;
      state.current.lastEvent = null;
      state.current.scrollContainer = null;
    },
    [callbacks, autoScroll],
  );

  useEffect(() => {
    document.addEventListener('mouseup', onMouseUpHandler);
    return () => document.removeEventListener('mouseup', onMouseUpHandler);
  }, [onMouseUpHandler]);

  return {
    onMouseDownHandler,
    onMouseMoveHandler,
  };
}
