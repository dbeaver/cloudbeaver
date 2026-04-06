/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PASTE_STRATEGIES } from './strategies.js';
import type { IPasteContext, IPasteParams, IPasteUpdate } from './types.js';

/**
 * Compute paste updates from a parsed TSV grid into a target selection.
 *
 * `visualColumnOrder` is the list of column keys in their current visual order
 * (accounting for pinning and drag reorder). This ensures paste maps columns
 * by visual position, not data index.
 *
 * Rules:
 * - Single cell copied -> paste into single focused cell (1:1)
 * - Single cell copied -> paste into selection: paste same value to all cells in target
 * - Region copied -> paste into single focused cell: paste region starting at focused cell, clip to grid bounds
 * - Region copied -> paste into target region:
 *   - If target is smaller than source: paste partially (only what fits in target)
 *   - If target is larger than or equal to source: paste once at top-left of target, no duplication
 *
 * Skips cells that are not editable.
 */
export function computePasteUpdates(params: IPasteParams): IPasteUpdate[] {
  const { pastedGrid } = params;

  const rowCount = pastedGrid.length;
  const colCount = pastedGrid[0]?.length ?? 0;

  if (rowCount === 0 || colCount === 0) {
    return [];
  }

  const context: IPasteContext = {
    ...params,
    rowCount,
    colCount,
    isSingleCell: rowCount === 1 && colCount === 1,
    hasSelection: params.selectedCells.size > 0,
    singleCellValue: pastedGrid[0]?.[0],
  };

  for (const strategy of PASTE_STRATEGIES) {
    if (strategy.matches(context)) {
      return strategy.apply(context);
    }
  }

  return [];
}
