/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';
import type { ILastSelectionRegion } from '../../DataGridSelection/DataGridSelectionContext.js';

export interface IBoundingBox {
  startRowIdx: number;
  endRowIdx: number;
  startColIdx: number;
  endColIdx: number;
  rows: number;
  columns: number;
}

export interface IExtractedCells {
  cells: Array<Array<{ sourceKey: IGridDataKey; value: unknown }>>;
  columnKeys: IGridColumnKey[];
  rowKeys: IGridRowKey[];
}

export interface IExtractCellsParams {
  tableData: ITableData;
  selectedCells: Map<string, IGridDataKey[]>;
  getCellRawValue: (key: IGridDataKey) => unknown;
}

export interface IExtractFromRegionParams {
  region: ILastSelectionRegion;
  getCellRawValue: (key: IGridDataKey) => unknown;
}
