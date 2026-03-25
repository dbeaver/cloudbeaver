/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  DatabaseSelectAction,
  type IGridDataKey,
  GridDataKeysUtils,
  type IDatabaseValueHolder,
  type IResultSetValue,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';

type CellUpdate = { key: IGridDataKey; value: string };

function sortRowsByIndex(rows: IGridDataKey[][], tableData: ITableData): IGridDataKey[][] {
  return rows.toSorted((a, b) => tableData.getRowIndexFromKey(a[0]!.row) - tableData.getRowIndexFromKey(b[0]!.row));
}

function sortCellsByColumn(cells: IGridDataKey[], tableData: ITableData): IGridDataKey[] {
  return cells.toSorted((a, b) => tableData.getColumnIndexFromColumnKey(a.column) - tableData.getColumnIndexFromColumnKey(b.column));
}

function getColumnSignature(row: IGridDataKey[], tableData: ITableData): string {
  return row.map(cell => tableData.getColumnIndexFromColumnKey(cell.column)).join(',');
}

function areIndicesContiguous(indices: number[]): boolean {
  return indices.every((val, i) => i === 0 || val === indices[i - 1]! + 1);
}

function isCellEditable(key: IGridDataKey, tableData: ITableData): boolean {
  const cellHolder = tableData.view.getCellHolder(key) as IDatabaseValueHolder<IGridDataKey, IResultSetValue>;

  return !(
    tableData.format.isReadOnly(key) ||
    tableData.format.isBinary(cellHolder) ||
    tableData.dataContent.isTextTruncated(cellHolder) ||
    tableData.dataContent.isBlobTruncated(cellHolder)
  );
}

function filterApplicableUpdates(updates: CellUpdate[], tableData: ITableData): CellUpdate[] {
  return updates.filter(
    ({ key, value }) => isCellEditable(key, tableData) && tableData.format.getText(tableData.format.get(key)) !== value,
  );
}

export const GridCellsClipboardHelper = {
  isGridClipboardTarget(event: React.KeyboardEvent): boolean {
    const role = (document.activeElement as HTMLElement | null)?.getAttribute('role');

    return role === 'gridcell' || role === 'columnheader' || event.target === event.currentTarget;
  },
  isContiguousSelection(selectedCells: Map<string, IGridDataKey[]>, tableData: ITableData): boolean {
    if (selectedCells.size === 0) {
      return true;
    }

    const rows = sortRowsByIndex([...selectedCells.values()], tableData);
    const rowIndices = rows.map(r => tableData.getRowIndexFromKey(r[0]!.row));

    if (!areIndicesContiguous(rowIndices)) {
      return false;
    }

    const firstRowCols = rows[0]!.map(cell => tableData.getColumnIndexFromColumnKey(cell.column)).sort((a, b) => a - b);

    if (!areIndicesContiguous(firstRowCols)) {
      return false;
    }

    const colSignature = firstRowCols.join(',');

    return rows.every(row => getColumnSignature(sortCellsByColumn(row, tableData), tableData) === colSignature);
  },
  getCellCopyValue(tableData: ITableData, key: IGridDataKey): string {
    return tableData.format.getText(tableData.format.get(key));
  },
  getSelectedCellsValue(
    tableData: ITableData,
    selectedCells: Map<string, IGridDataKey[]>,
    focusedCell?: IGridDataKey | null,
  ): string | null {
    if (selectedCells.size === 0) {
      return focusedCell && isCellEditable(focusedCell, tableData) ? this.getCellCopyValue(tableData, focusedCell) : null;
    }

    if (!this.isContiguousSelection(selectedCells, tableData)) {
      return null;
    }

    const orderedRows = sortRowsByIndex([...selectedCells.values()], tableData).map(row =>
      row.filter(cell => isCellEditable(cell, tableData)),
    );

    const selectedColumnKeys = new Set(orderedRows.flatMap(row => row.map(cell => GridDataKeysUtils.serialize(cell.column))));
    const selectedColumns = tableData.view.columnKeys.filter(column => selectedColumnKeys.has(GridDataKeysUtils.serialize(column)));

    if (selectedColumns.length === 0) {
      return null;
    }

    return orderedRows
      .map(rowSelection => {
        const rowCells = new Map(rowSelection.map(key => [GridDataKeysUtils.serialize(key.column), key]));

        return selectedColumns
          .map(column => {
            const cellKey = rowCells.get(GridDataKeysUtils.serialize(column));
            return cellKey ? this.getCellCopyValue(tableData, cellKey) : '';
          })
          .join('\t');
      })
      .join('\r\n');
  },
  parseClipboardData(text: string): string[][] {
    return text
      .split(/\r?\n/)
      .filter(row => row.length > 0)
      .map(row => row.split('\t'));
  },
  getPastedCells(
    clipboardText: string,
    selectionContext: IDataGridSelectionContext,
    selectionAction: DatabaseSelectAction | undefined,
    tableData: ITableData,
  ): CellUpdate[] {
    const clipboardData = this.parseClipboardData(clipboardText);

    if (clipboardData.length === 0) {
      return [];
    }

    const targetCells = this.getTargetCells(selectionContext, selectionAction);

    if (targetCells.length === 0) {
      return [];
    }

    return this.mapClipboardToSelection(clipboardData, targetCells, tableData);
  },
  getTargetCells(selectionContext: IDataGridSelectionContext, selectionAction: DatabaseSelectAction | undefined): IGridDataKey[] {
    const selectedCells = Array.from(selectionContext.selectedCells.values()).flat();

    if (selectedCells.length > 0) {
      return selectedCells;
    }

    const focused = selectionAction?.getFocusedElement() as IGridDataKey | null;
    return focused ? [focused] : [];
  },
  organize2DGrid(cells: IGridDataKey[], tableData: ITableData): IGridDataKey[][] {
    const rowMap = new Map<string, IGridDataKey[]>();

    for (const cell of cells) {
      const rowKey = GridDataKeysUtils.serialize(cell.row);
      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, []);
      }
      rowMap.get(rowKey)!.push(cell);
    }

    return sortRowsByIndex(
      Array.from(rowMap.values()),
      tableData,
    ).map(rowCells => sortCellsByColumn(rowCells, tableData));
  },
  partitionIntoSegments(cells: IGridDataKey[], tableData: ITableData): IGridDataKey[][][] {
    if (cells.length === 0) {
      return [];
    }

    const grid = this.organize2DGrid(cells, tableData);

    if (grid.length === 0) {
      return [];
    }

    const segments: IGridDataKey[][][] = [];
    let currentSegmentRows: IGridDataKey[][] = [grid[0]!];
    let prevRowIndex = tableData.getRowIndexFromKey(grid[0]![0]!.row);
    let prevColSignature = getColumnSignature(grid[0]!, tableData);

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r]!;
      const rowIndex = tableData.getRowIndexFromKey(row[0]!.row);
      const colSignature = getColumnSignature(row, tableData);

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
  mapClipboardToGrid(clipboard: string[][], targetGrid: IGridDataKey[][]): CellUpdate[] {
    const clipCols = clipboard[0]?.length ?? 0;
    const updates: CellUpdate[] = [];

    for (let tRow = 0; tRow < Math.min(targetGrid.length, clipboard.length); tRow++) {
      for (let tCol = 0; tCol < Math.min(targetGrid[tRow]!.length, clipCols); tCol++) {
        updates.push({
          key: targetGrid[tRow]![tCol]!,
          value: clipboard[tRow]![tCol]!,
        });
      }
    }

    return updates;
  },
  mapClipboardToSelection(clipboard: string[][], targets: IGridDataKey[], tableData: ITableData): CellUpdate[] {
    const clipCols = clipboard[0]?.length ?? 0;

    if (clipboard.length === 0 || clipCols === 0) {
      return [];
    }

    let updates: CellUpdate[];

    if (clipboard.length === 1 && clipCols === 1) {
      const value = clipboard[0]![0]!;
      updates = targets.map(key => ({ key, value }));
    } else {
      updates = this.partitionIntoSegments(targets, tableData).flatMap(segmentGrid => this.mapClipboardToGrid(clipboard, segmentGrid));
    }

    return filterApplicableUpdates(updates, tableData);
  },
};

export const gridCellsClipboardHelper = GridCellsClipboardHelper;
