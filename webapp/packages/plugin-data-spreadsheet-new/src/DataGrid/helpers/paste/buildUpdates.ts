/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import { getVisualColumnIndex } from './boundingBox.js';
import type { IBuildUpdatesParams, IPasteUpdate } from './types.js';
import { parseValueForCell } from './valueParser.js';

export function buildUpdates(params: IBuildUpdatesParams): IPasteUpdate[] {
  const { grid, startRow, startCol, pasteRows, pasteCols, tableData, visualColumnOrder, isCellEditable } = params;

  const updates: IPasteUpdate[] = [];

  const startRowIdx = tableData.getRowIndexFromKey(startRow);
  const startVisualColIdx = getVisualColumnIndex(startCol, visualColumnOrder);

  if (startVisualColIdx === -1) {
    return [];
  }

  for (let r = 0; r < pasteRows; r++) {
    const targetRow = tableData.getRow(startRowIdx + r);
    if (!targetRow) {
      continue;
    }

    for (let c = 0; c < pasteCols; c++) {
      const visualIdx = startVisualColIdx + c;
      if (visualIdx >= visualColumnOrder.length) {
        break;
      }

      const targetColKey = visualColumnOrder[visualIdx]!;
      const key: IGridDataKey = { row: targetRow, column: targetColKey };

      if (!isCellEditable(key)) {
        continue;
      }

      const rawValue = grid[r]?.[c];
      if (rawValue === undefined) {
        continue;
      }

      const parsedValue = parseValueForCell(rawValue, key, tableData);
      if (parsedValue === undefined) {
        continue;
      }

      updates.push({ key, value: parsedValue });
    }
  }

  return updates;
}
