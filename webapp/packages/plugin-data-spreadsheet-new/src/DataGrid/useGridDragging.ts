/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

interface IDraggingPosition {
  idx: number;
  rowIdx: number;
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

  const rowIdx = cell.getAttribute('data-rowindex');
  const columnIdx = cell.getAttribute('data-columnindex');

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

  const state = useObjectRef<IDraggingState>({
    startDraggingCell: null,
    currentDraggingCell: null,
    startMousePosition: null,
    dragging: false,
    mouseDown: false,
  }, {});

  const onMouseDownHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const position = getCellPositionFromEvent(event);

    if (!position) {
      return;
    }

    state.current.mouseDown = true;
    state.current.startMousePosition = { x: event.pageX, y: event.pageY };
    state.current.startDraggingCell = { idx: position.colIdx, rowIdx: position.rowIdx };
  }, []);

  const onMouseMoveHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!state.current.mouseDown) {
      return;
    }

    const position = getCellPositionFromEvent(event);

    if (!position) {
      return;
    }

    if (!state.current.dragging) {
      const delta = getDelta(state.current.startMousePosition, { x: event.pageX, y: event.pageY });
      if (!isDraggingStarted(delta, THRESHOLD)) {
        return;
      }

      if (callbacks.current.onDragStart && state.current.startDraggingCell) {
        callbacks.current.onDragStart(state.current.startDraggingCell, event);
      }

      state.current.dragging = true;
      return;
    }

    // check if the new cell is equal to the previous cell
    if (position.rowIdx === state.current.currentDraggingCell?.rowIdx
      && position.colIdx === state.current.currentDraggingCell.idx) {
      return;
    }

    state.current.currentDraggingCell = { idx: position.colIdx, rowIdx: position.rowIdx };

    if (callbacks.current.onDragOver) {
      callbacks.current.onDragOver(
        {
          idx: state.current.startDraggingCell!.idx,
          rowIdx: state.current.startDraggingCell!.rowIdx,
        },
        {
          idx: position.colIdx,
          rowIdx: position.rowIdx,
        },
        event);
    }
  }, []);

  const onMouseUpHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {
    state.current.mouseDown = false;
    state.current.startMousePosition = null;

    if (!state.current.dragging || !state.current.startDraggingCell || !state.current.currentDraggingCell) {
      return;
    }

    if (callbacks.current.onDragEnd) {
      callbacks.current.onDragEnd(
        {
          idx: state.current.startDraggingCell.idx,
          rowIdx: state.current.startDraggingCell.rowIdx,
        },
        {
          idx: state.current.currentDraggingCell.idx,
          rowIdx: state.current.currentDraggingCell.rowIdx,
        },
        event);
    }

    state.current.dragging = false;
    state.current.startMousePosition = null;
    state.current.currentDraggingCell = null;
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
