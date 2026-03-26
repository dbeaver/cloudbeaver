/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DatabaseSelectAction, GridDataKeysUtils, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';
import { GridCellsHelper } from './gridCellsHelper.js';

export const GridSelectionHelper = {
  isContiguousSelection(selectedCells: Map<string, IGridDataKey[]>, tableData: ITableData): boolean {
    if (selectedCells.size === 0) {
      return true;
    }

    const cells = [...selectedCells.values()].flat();
    return this.getSelectionSegments(cells, tableData).length === 1;
  },
  getSelectedCells(selectionContext: IDataGridSelectionContext, selectionAction: DatabaseSelectAction | undefined): IGridDataKey[] {
    const selectedCells = Array.from(selectionContext.selectedCells.values()).flat();

    if (selectedCells.length > 0) {
      return selectedCells;
    }

    const focused = selectionAction?.getFocusedElement() as IGridDataKey | null;
    return focused ? [focused] : [];
  },
  getSelectionSegments(cells: IGridDataKey[], tableData: ITableData): IGridDataKey[][][] {
    if (cells.length === 0) {
      return [];
    }

    const rowMap = new Map<string, IGridDataKey[]>();

    for (const cell of cells) {
      const rowKey = GridDataKeysUtils.serialize(cell.row);
      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, []);
      }
      rowMap.get(rowKey)!.push(cell);
    }

    const grid = GridCellsHelper.sortRowsByIndex(Array.from(rowMap.values()), tableData).map(rowCells =>
      GridCellsHelper.sortCellsByColumn(rowCells, tableData),
    );

    if (grid.length === 0) {
      return [];
    }

    const segments: IGridDataKey[][][] = [];
    let currentSegmentRows: IGridDataKey[][] = [grid[0]!];
    let prevRowIndex = tableData.getRowIndexFromKey(grid[0]![0]!.row);
    let prevColSignature = GridCellsHelper.getColumnSignature(grid[0]!, tableData);

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r]!;
      const rowIndex = tableData.getRowIndexFromKey(row[0]!.row);
      const colSignature = GridCellsHelper.getColumnSignature(row, tableData);

      if (rowIndex === prevRowIndex + 1 && colSignature === prevColSignature) {
        currentSegmentRows.push(row);
      } else {
        segments.push(currentSegmentRows);
        currentSegmentRows = [row];
      }

      prevRowIndex = rowIndex;
      prevColSignature = colSignature;
    }

    segments.push(currentSegmentRows);

    return segments;
  },
};
