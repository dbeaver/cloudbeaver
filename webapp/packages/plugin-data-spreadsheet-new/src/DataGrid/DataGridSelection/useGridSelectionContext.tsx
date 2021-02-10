/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
  isIndexColumn: boolean;
}

interface IGridSelectionOptions {
  indexColumnKey: string;
}

export function useGridSelectionContext(modelResultData: IDatabaseDataResult | null, options: IGridSelectionOptions) {
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

    const rowSelection = [];
    for (let i = 0; i < columnsLength; i++) {
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

  const selectRange = useCallback(action((idx: number, rowIdx: number, isIndexCol: boolean) => {
    if (!lastSelectedCell) {
      throw new Error('Last selected cell must be provided');
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
      if (isIndexCol || lastSelectedCell.isIndexColumn) {
        selectRow(rowIdx, true);
        continue;
      }
      selectedCells.set(rowIdx, [...rowSelection]);
    }
  }), [selectedCells, lastSelectedCell]);

  const isSelected = useCallback((key: string, rowIdx: number) => {
    if (!selectedCells.has(rowIdx)) {
      return false;
    }

    const rowSelection = selectedCells.get(rowIdx)!;
    const idx = Number.parseInt(key);
    return rowSelection.includes(idx);
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
      return true;
    }
    return false;
  }, [selectedCells]);

  const selectCell = useCallback((idx: number, rowIdx: number) => {
    const rowSelection = selectedCells.get(rowIdx);
    if (rowSelection === undefined) {
      selectedCells.set(rowIdx, [idx]);
      return;
    }

    rowSelection.push(idx);
  }, [selectedCells]);

  const select = useCallback((key: string, rowIdx: number, multiple: boolean, range: boolean) => {
    const isIndexColumn = key === options.indexColumnKey;
    const columnIndex = isIndexColumn ? 0 : Number.parseInt(key);

    setLastSelectedCell({ idx: columnIndex, rowIdx, isIndexColumn });

    if (selectedCells.size > 0 && range) {
      selectRange(columnIndex, rowIdx, isIndexColumn);
      return;
    }

    if (isIndexColumn) {
      if (multiple && isRowSelected(rowIdx)) {
        unSelectRow(rowIdx);
      } else {
        selectRow(rowIdx, multiple);
      }
      return;
    }

    if (!multiple) {
      selectedCells.clear();
    }

    if (isSelected(key, rowIdx)) {
      unSelect(columnIndex, rowIdx);
      return;
    }

    selectCell(columnIndex, rowIdx);
  }, [selectedCells, selectRow, selectRange, unSelect, isSelected, selectCell, isRowSelected, unSelectRow]);

  const context: IDataGridSelectionContext = useMemo(() => ({
    selectedCells,
    select,
    isSelected,
  }), [selectedCells, select, isSelected]);

  return context;
}
