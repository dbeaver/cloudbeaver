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

export const GridCellsClipboardHelper = {
  isGridClipboardTarget(event: React.KeyboardEvent): boolean {
    const activeElement = document.activeElement as HTMLElement | null;

    return !(
      activeElement?.getAttribute('role') !== 'gridcell' &&
      activeElement?.getAttribute('role') !== 'columnheader' &&
      event.target !== event.currentTarget
    );
  },
  isContiguousSelection(selectedCells: Map<string, IGridDataKey[]>, tableData: ITableData): boolean {
    if (selectedCells.size === 0) {
      return true;
    }

    const rows = [...selectedCells.values()].sort(
      (a, b) => tableData.getRowIndexFromKey(a[0]!.row) - tableData.getRowIndexFromKey(b[0]!.row),
    );

    const rowIndices = rows.map(r => tableData.getRowIndexFromKey(r[0]!.row));
    for (let i = 1; i < rowIndices.length; i++) {
      if (rowIndices[i] !== rowIndices[i - 1]! + 1) {
        return false;
      }
    }

    const firstRowCols = rows[0]!.map(cell => tableData.getColumnIndexFromColumnKey(cell.column)).sort((a, b) => a - b);

    for (let i = 1; i < firstRowCols.length; i++) {
      if (firstRowCols[i] !== firstRowCols[i - 1]! + 1) {
        return false;
      }
    }

    const colSignature = firstRowCols.join(',');
    for (let r = 1; r < rows.length; r++) {
      const rowCols = rows[r]!.map(cell => tableData.getColumnIndexFromColumnKey(cell.column)).sort((a, b) => a - b);
      if (rowCols.join(',') !== colSignature) {
        return false;
      }
    }

    return true;
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
      return focusedCell ? this.getCellCopyValue(tableData, focusedCell) : null;
    }

    if (!this.isContiguousSelection(selectedCells, tableData)) {
      return null;
    }

    const orderedRows = [...selectedCells.values()].sort((a, b) => tableData.getRowIndexFromKey(a[0]!.row) - tableData.getRowIndexFromKey(b[0]!.row));

    const selectedColumnKeys = new Set(orderedRows.flatMap(row => row.map(cell => GridDataKeysUtils.serialize(cell.column))));
    const selectedColumns = tableData.view.columnKeys.filter(column => selectedColumnKeys.has(GridDataKeysUtils.serialize(column)));

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
    const rows = text.split(/\r?\n/);
    return rows.filter(row => row.length > 0).map(row => row.split('\t'));
  },
  getPastedCells(
    clipboardText: string,
    selectionContext: IDataGridSelectionContext,
    selectionAction: DatabaseSelectAction | undefined,
    tableData: ITableData,
  ): Array<{ key: IGridDataKey; value: string }> {
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

    const sortedRows = Array.from(rowMap.entries()).sort((a, b) => {
      const rowA = tableData.getRowIndexFromKey(a[1]![0]!.row);
      const rowB = tableData.getRowIndexFromKey(b[1]![0]!.row);
      return rowA - rowB;
    });

    return sortedRows.map(([_, rowCells]) =>
      rowCells.sort((a, b) => tableData.getColumnIndexFromColumnKey(a.column) - tableData.getColumnIndexFromColumnKey(b.column)),
    );
  },
  partitionIntoSegments(cells: IGridDataKey[], tableData: ITableData): IGridDataKey[][][] {
    if (cells.length === 0) {
      return [];
    }

    const grid = this.organize2DGrid(cells, tableData);

    if (grid.length === 0) {
      return [];
    }

    const getColSignature = (row: IGridDataKey[]) => row.map(cell => tableData.getColumnIndexFromColumnKey(cell.column)).join(',');

    const segments: IGridDataKey[][][] = [];
    let currentSegmentRows: IGridDataKey[][] = [grid[0]!];
    let prevRowIndex = tableData.getRowIndexFromKey(grid[0]![0]!.row);
    let prevColSignature = getColSignature(grid[0]!);

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r]!;
      const rowIndex = tableData.getRowIndexFromKey(row[0]!.row);
      const colSignature = getColSignature(row);

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
  mapClipboardToGrid(clipboard: string[][], targetGrid: IGridDataKey[][]): Array<{ key: IGridDataKey; value: string }> {
    const clipRows = clipboard.length;
    const clipCols = clipboard[0]?.length ?? 0;
    const updates: Array<{ key: IGridDataKey; value: string }> = [];

    for (let tRow = 0; tRow < Math.min(targetGrid.length, clipRows); tRow++) {
      for (let tCol = 0; tCol < Math.min(targetGrid[tRow]!.length, clipCols); tCol++) {
        updates.push({
          key: targetGrid[tRow]![tCol]!,
          value: clipboard[tRow]![tCol]!,
        });
      }
    }

    return updates;
  },
  mapClipboardToSelection(clipboard: string[][], targets: IGridDataKey[], tableData: ITableData): Array<{ key: IGridDataKey; value: string }> {
    const clipRows = clipboard.length;
    const clipCols = clipboard[0]?.length ?? 0;

    if (clipRows === 0 || clipCols === 0) {
      return [];
    }

    if (clipRows === 1 && clipCols === 1) {
      const value = clipboard[0]![0]!;
      const updates = targets.map(key => ({ key, value }));
      const editableUpdates = this.filterEditableCells(updates, tableData);
      return this.filterChangedCells(editableUpdates, tableData);
    }

    const segments = this.partitionIntoSegments(targets, tableData);
    const allUpdates: Array<{ key: IGridDataKey; value: string }> = [];

    for (const segmentGrid of segments) {
      allUpdates.push(...this.mapClipboardToGrid(clipboard, segmentGrid));
    }

    const editableUpdates = this.filterEditableCells(allUpdates, tableData);
    return this.filterChangedCells(editableUpdates, tableData);
  },
  filterEditableCells(updates: Array<{ key: IGridDataKey; value: string }>, tableData: ITableData): Array<{ key: IGridDataKey; value: string }> {
    return updates.filter(({ key }) => {
      const cellHolder = tableData.view.getCellHolder(key) as IDatabaseValueHolder<IGridDataKey, IResultSetValue>;

      return !(
        tableData.format.isReadOnly(key) ||
        tableData.format.isBinary(cellHolder) ||
        tableData.dataContent.isTextTruncated(cellHolder) ||
        tableData.dataContent.isBlobTruncated(cellHolder)
      );
    });
  },
  filterChangedCells(updates: Array<{ key: IGridDataKey; value: string }>, tableData: ITableData): Array<{ key: IGridDataKey; value: string }> {
    return updates.filter(({ key, value }) => this.getCellCopyValue(tableData, key) !== value);
  },
};

export const gridCellsClipboardHelper = GridCellsClipboardHelper;
