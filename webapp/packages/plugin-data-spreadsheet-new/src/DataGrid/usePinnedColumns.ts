/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useMemo, useState } from 'react';
import { GridDataKeysUtils, type IGridColumnKey } from '@cloudbeaver/plugin-data-viewer';
import type { IDataGridPinContext } from './DataGridPinContext.js';

export function usePinnedColumns(): {
  pinnedColumns: Set<string>;
  gridPinContext: IDataGridPinContext;
  pinColumn: (colIdx: IGridColumnKey) => void;
  unpinColumn: (colIdx: IGridColumnKey) => void;
  unpinAllColumns: () => void;
  isColumnPinned: (colIdx: IGridColumnKey) => boolean;
} {
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set());

  const pinColumn = useCallback((colIdx: IGridColumnKey) => {
    setPinnedColumns(prev => {
      const key = GridDataKeysUtils.serialize(colIdx);
      if (prev.has(key)) {
        return prev;
      }
      return new Set(prev).add(key);
    });
  }, []);

  const unpinColumn = useCallback((colIdx: IGridColumnKey) => {
    setPinnedColumns(prev => {
      const key = GridDataKeysUtils.serialize(colIdx);
      if (!prev.has(key)) {
        return prev;
      }
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  const unpinAllColumns = useCallback(() => {
    setPinnedColumns(new Set());
  }, []);

  const isColumnPinned = useCallback((colIdx: IGridColumnKey) => pinnedColumns.has(GridDataKeysUtils.serialize(colIdx)), [pinnedColumns]);
  const hasPinnedColumns = useCallback(() => pinnedColumns.size > 0, [pinnedColumns]);

  const gridPinContext = useMemo<IDataGridPinContext>(
    () => ({
      pinColumn,
      unpinColumn,
      unpinAllColumns,
      isColumnPinned,
      hasPinnedColumns,
    }),
    [pinColumn, unpinColumn, unpinAllColumns, isColumnPinned, hasPinnedColumns],
  );

  return { pinnedColumns, pinColumn, unpinColumn, unpinAllColumns, isColumnPinned, gridPinContext };
}
