/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DatabaseSelectAction, type IGridDataKey, GridDataKeysUtils, getCellTextValue } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';
import { type CellUpdate, GridCellsHelper } from './gridCellsHelper.js';
import { GridSelectionHelper } from './gridSelectionHelper.js';

const CELL_COLUMN_SEPARATOR = '\t';
const ROW_LINE_SEPARATOR = '\r\n';
const CLIPBOARD_LINE_SEPARATOR_REGEX = /\r?\n/;

export const GridClipboardHelper = {
  isClipboardTarget(event: React.KeyboardEvent): boolean {
    const role = (document.activeElement as HTMLElement | null)?.getAttribute('role');

    return role === 'gridcell' || role === 'columnheader' || event.target === event.currentTarget;
  },
  getValueFromSelectedCells(tableData: ITableData, selectedCells: Map<string, IGridDataKey[]>, focusedCell?: IGridDataKey | null): string | null {
    if (selectedCells.size === 0) {
      return focusedCell ? getCellTextValue(tableData.getCellHolder(focusedCell), tableData.format, tableData.dataContent) : null;
    }

    if (!GridSelectionHelper.isContiguousSelection(selectedCells, tableData)) {
      return null;
    }

    const orderedRows = GridCellsHelper.sortRowsByIndex([...selectedCells.values()], tableData);

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
            return cellKey ? getCellTextValue(tableData.getCellHolder(cellKey), tableData.format, tableData.dataContent) : '';
          })
          .join(CELL_COLUMN_SEPARATOR);
      })
      .join(ROW_LINE_SEPARATOR);
  },
  parseClipboard(text: string): string[][] {
    return text
      .split(CLIPBOARD_LINE_SEPARATOR_REGEX)
      .filter(row => row.length > 0)
      .map(row => row.split(CELL_COLUMN_SEPARATOR));
  },
  getPastedCells(
    clipboardText: string,
    selectionContext: IDataGridSelectionContext,
    selectionAction: DatabaseSelectAction | undefined,
    tableData: ITableData,
    hasElementIdentifier: boolean,
  ): CellUpdate[] {
    const clipboardData = this.parseClipboard(clipboardText);

    if (clipboardData.length === 0) {
      return [];
    }

    const targetCells = GridSelectionHelper.getSelectedCells(selectionContext, selectionAction);

    if (targetCells.length === 0) {
      return [];
    }

    return this.mapClipboardToSelection(clipboardData, targetCells, tableData, hasElementIdentifier);
  },
  mapClipboardToGrid(clipboard: string[][], targetGrid: IGridDataKey[][]): CellUpdate[] {
    const clipCols = clipboard[0]?.length ?? 0;

    return targetGrid
      .slice(0, clipboard.length)
      .flatMap((row, tRow) => row.slice(0, clipCols).map((key, tCol) => ({ key, value: clipboard[tRow]![tCol]! })));
  },
  mapClipboardToSelection(clipboard: string[][], targets: IGridDataKey[], tableData: ITableData, hasElementIdentifier: boolean): CellUpdate[] {
    const clipCols = clipboard[0]?.length ?? 0;

    if (clipboard.length === 0 || clipCols === 0) {
      return [];
    }

    let updates: CellUpdate[];

    if (clipboard.length === 1 && clipCols === 1) {
      const value = clipboard[0]![0]!;
      updates = targets.map(key => ({ key, value }));
    } else {
      updates = GridSelectionHelper.getSelectionSegments(targets, tableData).flatMap(segmentGrid => this.mapClipboardToGrid(clipboard, segmentGrid));
    }

    return updates.filter(
      ({ key, value }) =>
        GridCellsHelper.isCellEditable(key, tableData, hasElementIdentifier) && tableData.format.getText(tableData.format.get(key)) !== value,
    );
  },
};
