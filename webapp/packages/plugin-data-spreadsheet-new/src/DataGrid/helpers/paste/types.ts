/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';

export interface IPasteUpdate {
  key: IGridDataKey;
  value: string | null;
}

export interface IPasteParams {
  /** Parsed 2D grid of string values from clipboard */
  pastedGrid: string[][];
  /** Currently selected cells */
  selectedCells: Map<string, IGridDataKey[]>;
  /** Currently focused cell, if any */
  focusedElement: IGridDataKey | null;
  /** Table data context */
  tableData: ITableData;
  /** Column keys in visual order (accounting for pinning and reorder) */
  visualColumnOrder: IGridColumnKey[];
  /** Function to check if a cell can be edited */
  isCellEditable: (key: IGridDataKey) => boolean;
}

export interface IPasteContext extends IPasteParams {
  rowCount: number;
  colCount: number;
  isSingleCell: boolean;
  hasSelection: boolean;
  singleCellValue: string | undefined;
}

export interface IVisualBoundingBox {
  startRow: IGridRowKey;
  startCol: IGridColumnKey;
  rows: number;
  columns: number;
}

export interface IBuildUpdatesParams {
  grid: string[][];
  startRow: IGridRowKey;
  startCol: IGridColumnKey;
  pasteRows: number;
  pasteCols: number;
  tableData: ITableData;
  visualColumnOrder: IGridColumnKey[];
  isCellEditable: (key: IGridDataKey) => boolean;
}
