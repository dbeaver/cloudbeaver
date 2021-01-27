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

interface IPosition {
  idx: number;
  rowIdx: number;
}

export function useGridSelectionContext(modelResultData: IDatabaseDataResult | null) {
  const [selectedCells] = useState(() => observable.map<number, number[]>());
  const [lastSelectedCell, setLastSelectedCell] = useState<IPosition | null>(null);

  const selectRow = useCallback(action((rowIdx: number, multiple: boolean) => {
    if (!modelResultData) {
      throw new Error('Model result data must be provided');
    }

    const columnsLength = (modelResultData.data as SqlResultSet).columns?.length || 0;

    if (!multiple) {
      selectedCells.clear();
    }

    // we don't include index column
    const rowSelection = [];
    for (let i = 1; i <= columnsLength; i++) {
      rowSelection.push(i);
    }

    selectedCells.set(rowIdx, rowSelection);
  }), [selectedCells, modelResultData]);

  const isRowSelected = useCallback((rowIdx: number) => {
    if (!modelResultData) {
      throw new Error('Model result data must be provided');
    }

    const columnsLength = (modelResultData.data as SqlResultSet).columns?.length || 0;

    return selectedCells.get(rowIdx)?.length === columnsLength;
  }, [modelResultData, selectedCells]);

  const unSelectRow = useCallback((rowIdx: number) => {
    selectedCells.delete(rowIdx);
  }, [selectedCells]);

  const selectRange = useCallback(action((idx: number, rowIdx: number) => {
    if (!lastSelectedCell) {
      throw new Error('Current selected cell must be provided');
    }

    selectedCells.clear();

    const left = Math.min(idx, lastSelectedCell.idx);
    const right = Math.max(idx, lastSelectedCell.idx);
    const top = Math.min(rowIdx, lastSelectedCell.rowIdx);
    const bottom = Math.max(rowIdx, lastSelectedCell.rowIdx);

    const rowSelection = [];
    for (let colIdx = left; colIdx <= right; colIdx++) {
      rowSelection.push(colIdx);
    }
    for (let rowIdx = top; rowIdx <= bottom; rowIdx++) {
      selectedCells.set(rowIdx, rowSelection);
    }
  }), [selectedCells, lastSelectedCell]);

  const isSelected = useCallback((idx: number, rowIdx: number) => {
    if (!selectedCells.has(rowIdx)) {
      return false;
    }

    const rowSelection = selectedCells.get(rowIdx)!;
    return rowSelection.indexOf(idx) !== -1;
  },
  [selectedCells]);

  const unSelect = useCallback((idx: number, rowIdx: number) => {
    if (!selectedCells.has(rowIdx)) {
      return false;
    }

    const rowSelection = selectedCells.get(rowIdx)!;
    const targetIndex = rowSelection.indexOf(idx);

    if (targetIndex !== -1) {
      rowSelection.splice(targetIndex, 1);
      selectedCells.set(rowIdx, rowSelection);
      return true;
    }
    return false;
  }, [selectedCells]);

  const selectCell = useCallback((idx: number, rowIdx: number) => {
    const rowSelection = selectedCells.get(rowIdx);
    if (rowSelection === undefined) {
      return;
    }

    rowSelection.push(idx);
    selectedCells.set(rowIdx, rowSelection);
  }, [selectedCells]);

  const select = useCallback((idx: number, rowIdx: number, multiple: boolean, range: boolean) => {
    setLastSelectedCell({ idx: idx === 0 ? idx + 1 : idx, rowIdx });
    if (selectedCells.size > 0 && range) {
      selectRange(idx === 0 ? idx + 1 : idx, rowIdx);
      return;
    }

    // it's index column
    if (idx === 0) {
      multiple && isRowSelected(rowIdx) ? unSelectRow(rowIdx) : selectRow(rowIdx, multiple);
      return;
    }

    if (!multiple) {
      selectedCells.clear();
    }

    if (!selectedCells.has(rowIdx)) {
      selectedCells.set(rowIdx, [idx]);
      return;
    }

    if (isSelected(idx, rowIdx)) {
      unSelect(idx, rowIdx);
      return;
    }

    selectCell(idx, rowIdx);
  }, [selectedCells, selectRow, selectRange, unSelect, isSelected, selectCell, isRowSelected, unSelectRow]);

  const context: IDataGridSelectionContext = useMemo(() => ({
    selectedCells,
    select,
    isSelected,
  }), [selectedCells, select, isSelected]);

  return context;
}
