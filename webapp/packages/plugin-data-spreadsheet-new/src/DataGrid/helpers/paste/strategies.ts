/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import { getVisualBoundingBox, getVisualColumnIndex } from './boundingBox.js';
import { buildUpdates } from './buildUpdates.js';
import type { IPasteContext, IPasteUpdate } from './types.js';
import { parseValueForCell } from './valueParser.js';

interface IPasteStrategy {
  matches: (ctx: IPasteContext) => boolean;
  apply: (ctx: IPasteContext) => IPasteUpdate[];
}

function pasteSingleCellToSelection(ctx: IPasteContext): IPasteUpdate[] {
  const { singleCellValue, selectedCells, tableData, isCellEditable } = ctx;

  if (singleCellValue === undefined) {
    return [];
  }

  const updates: IPasteUpdate[] = [];

  for (const cells of selectedCells.values()) {
    for (const cell of cells) {
      const key: IGridDataKey = { row: cell.row, column: cell.column };
      if (isCellEditable(key)) {
        const parsedValue = parseValueForCell(singleCellValue, key, tableData);
        if (parsedValue !== undefined) {
          updates.push({ key, value: parsedValue });
        }
      }
    }
  }

  return updates;
}

function pasteSingleCellToFocused(ctx: IPasteContext): IPasteUpdate[] {
  const { singleCellValue, focusedElement, tableData, isCellEditable } = ctx;

  if (singleCellValue === undefined || focusedElement === null || !isCellEditable(focusedElement)) {
    return [];
  }

  const parsedValue = parseValueForCell(singleCellValue, focusedElement, tableData);
  if (parsedValue === undefined) {
    return [];
  }

  return [{ key: focusedElement, value: parsedValue }];
}

function pasteGridToSelection(ctx: IPasteContext): IPasteUpdate[] {
  const { pastedGrid, rowCount, colCount, selectedCells, tableData, visualColumnOrder, isCellEditable } = ctx;

  const visualBox = getVisualBoundingBox(selectedCells, tableData, visualColumnOrder);
  if (!visualBox) {
    return [];
  }

  const pasteRows = Math.min(rowCount, visualBox.rows);
  const pasteCols = Math.min(colCount, visualBox.columns);

  return buildUpdates({
    grid: pastedGrid,
    startRow: visualBox.startRow,
    startCol: visualBox.startCol,
    pasteRows,
    pasteCols,
    tableData,
    visualColumnOrder,
    isCellEditable,
  });
}

function pasteGridFromFocused(ctx: IPasteContext): IPasteUpdate[] {
  const { pastedGrid, rowCount, colCount, focusedElement, selectedCells, tableData, visualColumnOrder, isCellEditable } = ctx;

  if (focusedElement === null) {
    return [];
  }

  const visualColIdx = getVisualColumnIndex(focusedElement.column, visualColumnOrder);
  if (visualColIdx === -1) {
    return [];
  }

  const startRowIdx = tableData.getRowIndexFromKey(focusedElement.row);

  // If there's a multi-cell selection, use its size to limit the paste area
  // For single-cell selection, paste the whole region (as much as fits)
  const visualBox = selectedCells.size > 0 ? getVisualBoundingBox(selectedCells, tableData, visualColumnOrder) : null;
  const isSingleCellSelection = visualBox && visualBox.rows === 1 && visualBox.columns === 1;

  // Calculate paste bounds: use selection size only for multi-cell selection, otherwise use grid bounds
  const maxRows = visualBox && !isSingleCellSelection ? visualBox.rows : tableData.rows.length - startRowIdx;
  const maxCols = visualBox && !isSingleCellSelection ? visualBox.columns : visualColumnOrder.length - visualColIdx;

  const pasteRows = Math.min(rowCount, maxRows);
  const pasteCols = Math.min(colCount, maxCols);

  return buildUpdates({
    grid: pastedGrid,
    startRow: focusedElement.row,
    startCol: focusedElement.column,
    pasteRows,
    pasteCols,
    tableData,
    visualColumnOrder,
    isCellEditable,
  });
}

/**
 * Paste strategies ordered by priority.
 * First matching strategy is applied.
 *
 * Note: Region paste always starts from the focused element (if available).
 * - For multi-cell selection: uses selection size to limit paste area
 * - For single-cell selection or no selection: pastes whole region (as much as fits)
 */
export const PASTE_STRATEGIES: IPasteStrategy[] = [
  {
    // Single cell -> selection: paste same value to all cells
    matches: ctx => ctx.isSingleCell && ctx.hasSelection && ctx.singleCellValue !== undefined,
    apply: pasteSingleCellToSelection,
  },
  {
    // Single cell -> focused: paste to focused cell
    matches: ctx => ctx.isSingleCell && !ctx.hasSelection && ctx.focusedElement !== null && ctx.singleCellValue !== undefined,
    apply: pasteSingleCellToFocused,
  },
  {
    // Region -> focused: paste region starting at focused cell, clipped to selection size if available
    matches: ctx => !ctx.isSingleCell && ctx.focusedElement !== null,
    apply: pasteGridFromFocused,
  },
  {
    // Region -> selection: paste region clipped to selection bounds (fallback when no focused element)
    matches: ctx => !ctx.isSingleCell && ctx.hasSelection,
    apply: pasteGridToSelection,
  },
];
