/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

export interface IDraggingPosition {
  rowIdx: number;
  colIdx: number;
}

interface IMousePosition {
  x: number;
  y: number;
}

type DraggingCallback = (
  startPosition: IDraggingPosition,
  currentPosition: IDraggingPosition,
  event: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent
) => void;

interface IDraggingState {
  startDraggingCell: IDraggingPosition | null;
  currentDraggingCell: IDraggingPosition | null;
  startMousePosition: IMousePosition | null;
  dragging: boolean;
  mouseDown: boolean;
}

interface IDraggingCallbacks {
  onDragStart?: (
    startPosition: IDraggingPosition,
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent
  ) => void;
  onDragOver?: DraggingCallback;
  onDragEnd?: DraggingCallback;
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

function getCellPositionFromEvent(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
  const target = event.target as HTMLElement;
  const cell = target.closest('[role="gridcell"]') as HTMLElement | null;

  if (!cell) {
    return;
  }

  const rowIdx = cell.getAttribute('data-row-index');
  const columnIdx = cell.getAttribute('data-column-index');

  if (!rowIdx || !columnIdx) {
    return;
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

export function useGridDragging(props: IDraggingCallbacks) {
  const callbacks = useObjectRef(props);

  const state = useObjectRef<IDraggingState>(() => ({
    startDraggingCell: null,
    currentDraggingCell: null,
    startMousePosition: null,
    dragging: false,
    mouseDown: false,
  }), false);

  const onMouseDownHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const position = getCellPositionFromEvent(event);

    if (!position) {
      return;
    }

    state.mouseDown = true;
    state.startMousePosition = { x: event.pageX, y: event.pageY };
    state.startDraggingCell = { colIdx: position.colIdx, rowIdx: position.rowIdx };
  }, []);

  const onMouseMoveHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!state.mouseDown) {
      return;
    }

    const position = getCellPositionFromEvent(event);

    if (!position) {
      return;
    }

    if (!state.dragging) {
      const delta = getDelta(state.startMousePosition, { x: event.pageX, y: event.pageY });
      if (!isDraggingStarted(delta, THRESHOLD)) {
        return;
      }

      if (callbacks.onDragStart && state.startDraggingCell) {
        callbacks.onDragStart(state.startDraggingCell, event);
      }

      state.dragging = true;
      return;
    }

    // check if the new cell is equal to the previous cell
    if (position.rowIdx === state.currentDraggingCell?.rowIdx
      && position.colIdx === state.currentDraggingCell.colIdx) {
      return;
    }

    state.currentDraggingCell = { colIdx: position.colIdx, rowIdx: position.rowIdx };

    if (callbacks.onDragOver) {
      callbacks.onDragOver(
        {
          colIdx: state.startDraggingCell!.colIdx,
          rowIdx: state.startDraggingCell!.rowIdx,
        },
        {
          colIdx: position.colIdx,
          rowIdx: position.rowIdx,
        },
        event);
    }
  }, []);

  const onMouseUpHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {
    state.mouseDown = false;
    state.startMousePosition = null;

    if (!state.dragging || !state.startDraggingCell || !state.currentDraggingCell) {
      return;
    }

    if (callbacks.onDragEnd) {
      callbacks.onDragEnd(
        {
          colIdx: state.startDraggingCell.colIdx,
          rowIdx: state.startDraggingCell.rowIdx,
        },
        {
          colIdx: state.currentDraggingCell.colIdx,
          rowIdx: state.currentDraggingCell.rowIdx,
        },
        event);
    }

    state.dragging = false;
    state.startMousePosition = null;
    state.currentDraggingCell = null;
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', onMouseUpHandler);
    return () => document.removeEventListener('mouseup', onMouseUpHandler);
  }, [onMouseUpHandler]);

  return {
    onMouseDownHandler,
    onMouseMoveHandler,
  };
}
