/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useCallback, useEffect } from 'react';

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

export function useGridDragging(callbacks: IDraggingCallbacks) {
  const { onDragStart, onDragOver, onDragEnd } = callbacks;

  const [startDraggingCell, setStartDraggingCell] = useState<IDraggingPosition | null>(null);
  const [currentDraggingCell, setCurrentDraggingCell] = useState<IDraggingPosition | null>(null);
  const [startMousePosition, setStartMousePosition] = useState<IMousePosition | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [mouseDown, setMouseDown] = useState(false);

  const onMouseDownHandler = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const position = getCellPositionFromEvent(event);

    if (!position) {
      return;
    }

    setMouseDown(true);
    setStartMousePosition({ ...startMousePosition, x: event.pageX, y: event.pageY });
    setStartDraggingCell({ idx: position.colIdx, rowIdx: position.rowIdx });
  };

  const onMouseMoveHandler = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!mouseDown) {
      return;
    }

    const position = getCellPositionFromEvent(event);

    if (!position) {
      return;
    }

    if (!isDragging) {
      const delta = getDelta(startMousePosition, { x: event.pageX, y: event.pageY });
      if (!isDraggingStarted(delta, THRESHOLD)) {
        return;
      }

      if (onDragStart && startDraggingCell) {
        onDragStart(startDraggingCell, event);
      }

      setDragging(true);
      return;
    }

    // check if the new cell is equal to the previous cell
    if (position.rowIdx === currentDraggingCell?.rowIdx
      && position.colIdx === currentDraggingCell.idx) {
      return;
    }

    setCurrentDraggingCell({ idx: position.colIdx, rowIdx: position.rowIdx });

    if (onDragOver) {
      onDragOver(
        {
          idx: startDraggingCell!.idx,
          rowIdx: startDraggingCell!.rowIdx,
        },
        {
          idx: position.colIdx,
          rowIdx: position.rowIdx,
        },
        event);
    }
  };

  const onMouseUpHandler = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent) => {
    setMouseDown(false);
    setStartMousePosition(null);

    if (!isDragging || !startDraggingCell || !currentDraggingCell) {
      return;
    }

    if (onDragEnd) {
      onDragEnd(
        {
          idx: startDraggingCell.idx,
          rowIdx: startDraggingCell.rowIdx,
        },
        {
          idx: currentDraggingCell.idx,
          rowIdx: currentDraggingCell.rowIdx,
        },
        event);
    }

    setDragging(false);
    setStartDraggingCell(null);
    setCurrentDraggingCell(null);
  }, [isDragging, currentDraggingCell, startDraggingCell, onDragEnd]);

  useEffect(() => {
    document.addEventListener('mouseup', onMouseUpHandler);
    return () => document.removeEventListener('mouseup', onMouseUpHandler);
  }, [onMouseUpHandler]);

  return {
    onMouseDownHandler,
    onMouseMoveHandler,
  };
}
