/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../TableDataContext.js';
import type { GridClipboard } from '../helpers/clipboard/GridClipboard.js';

export interface IClipboardOutline {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

const EMPTY_OUTLINE: IClipboardOutline = {
  top: false,
  right: false,
  bottom: false,
  left: false,
};

/**
 * Determines if a cell is part of the clipboard selection and calculates
 * which edges should display the dashed border.
 */
export function useClipboardOutline(
  rowIdx: number,
  colIdx: number,
  cell: IGridDataKey | undefined,
  gridClipboard: GridClipboard | null,
  tableDataContext: ITableData,
): { isClipboardCell: boolean; outline: IClipboardOutline } {
  const copiedRegion = gridClipboard?.copiedRegion ?? null;

  const isClipboardCell = useMemo(() => {
    if (!cell || !copiedRegion || !gridClipboard) {
      return false;
    }
    return gridClipboard.isCopiedCell(cell);
  }, [cell, copiedRegion, gridClipboard]);

  const outline = useMemo(() => {
    if (!isClipboardCell || !gridClipboard) {
      return EMPTY_OUTLINE;
    }

    const isClipboardCellAt = (rIdx: number, cIdx: number): boolean => {
      const row = tableDataContext.getRow(rIdx);
      const column = tableDataContext.getColumn(cIdx)?.key;

      if (!row || !column) {
        return false;
      }

      return gridClipboard.isCopiedCell({ row, column });
    };

    return {
      top: !isClipboardCellAt(rowIdx - 1, colIdx),
      right: !isClipboardCellAt(rowIdx, colIdx + 1),
      bottom: !isClipboardCellAt(rowIdx + 1, colIdx),
      left: !isClipboardCellAt(rowIdx, colIdx - 1),
    };
  }, [isClipboardCell, rowIdx, colIdx, gridClipboard, tableDataContext]);

  return { isClipboardCell, outline };
}
