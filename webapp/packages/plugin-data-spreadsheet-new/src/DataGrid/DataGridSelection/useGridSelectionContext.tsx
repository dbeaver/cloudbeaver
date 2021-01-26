/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useCallback, useMemo, useState } from 'react';

import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import type { IDatabaseDataResult } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelectionContext';

export interface IPosition {
  idx: number;
  rowIdx: number;
}

export function useGridSelectionContext(modelResultData: IDatabaseDataResult | null) {
  const [selectedCells] = useState(() => observable.map<string, IPosition>());
  const [currentSelectedCell, setCurrentSelectedCell] = useState<IPosition | null>(null);

  const selectRow = useCallback(action((rowIdx: number, multiple: boolean) => {
    if (!modelResultData) {
      throw new Error('Model result data must be provided');
    }

    const columnsLength = (modelResultData.data as SqlResultSet).columns?.length || 0;

    if (!multiple) {
      selectedCells.clear();
    }

    // we don't include index column
    for (let i = 1; i <= columnsLength; i++) {
      const hash = getHash(i, rowIdx);
      selectedCells.set(hash, { idx: i, rowIdx });
    }
  }), [selectedCells, modelResultData]);

  const selectRange = useCallback(action((idx: number, rowIdx: number) => {
    if (!currentSelectedCell) {
      throw new Error('Current selected cell must be provided');
    }

    const rowRange = rowIdx - currentSelectedCell.rowIdx;
    const columnRange = idx - currentSelectedCell.idx;

    // TODO we don't need this, will refactor
    const isColumnToBottom = columnRange > 0;
    const isRowToBottom = rowRange > 0;

    selectedCells.clear();

    for (let column = 0; column <= Math.abs(columnRange); column++) {
      const idx = isColumnToBottom ? column + currentSelectedCell.idx : currentSelectedCell.idx - column;
      if (idx === 0) {
        continue;
      }
      for (let row = 0; row <= Math.abs(rowRange); row++) {
        const rowIdx = isRowToBottom ? row + currentSelectedCell.rowIdx : currentSelectedCell.rowIdx - row;

        const hash = getHash(idx, rowIdx);
        selectedCells.set(hash, { idx, rowIdx });
      }
    }
  }), [selectedCells, currentSelectedCell]);

  const select = useCallback((idx: number, rowIdx: number, multiple: boolean, range: boolean) => {
    setCurrentSelectedCell({ idx: idx === 0 ? idx + 1 : idx, rowIdx });
    if (selectedCells.size > 0 && range) {
      selectRange(idx, rowIdx);
      return;
    }

    // it's index column
    if (idx === 0) {
      selectRow(rowIdx, multiple);
      return;
    }

    if (!multiple) {
      selectedCells.clear();
    }

    const hash = getHash(idx, rowIdx);

    if (selectedCells.has(hash)) {
      selectedCells.delete(hash);
      return;
    }

    selectedCells.set(hash, { idx, rowIdx });
  }, [selectedCells, selectRow, selectRange]);

  const isSelected = useCallback((idx: number, rowIdx: number) => {
    const hash = getHash(idx, rowIdx);
    return selectedCells.has(hash);
  },
  [selectedCells]);

  const context: IDataGridSelectionContext = useMemo(() => ({
    selectedCells,
    select,
    isSelected,
  }), [selectedCells, select, isSelected]);

  return context;
}

function getHash(idx: number, rowIdx: number) {
  return `${idx}_${rowIdx}`;
}
