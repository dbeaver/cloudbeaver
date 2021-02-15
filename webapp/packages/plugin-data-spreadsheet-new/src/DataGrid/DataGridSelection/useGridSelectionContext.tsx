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

import { indexColumn } from '../DataGridTable';
import type { IDataGridSelectionContext } from './DataGridSelectionContext';

export interface IPosition {
  idx: number;
  rowIdx: number;
  isIndexColumn: boolean;
}

interface IGridSelectionOptions {
  select: (position: Pick<IPosition, 'idx' | 'rowIdx'>) => void;
}

export function isIndexColumn(columnKey: string): boolean {
  return columnKey === indexColumn.key;
}

export function getColumnIdxFromColumnKey(columnKey: string): number {
  return isIndexColumn(columnKey) ? 0 : Number(columnKey);
}

export function useGridSelectionContext(modelResultData: IDatabaseDataResult | null, options: IGridSelectionOptions) {
  const [selectedCells] = useState(() => observable.map<number, number[]>());
  const [temporarySelectedCells] = useState(() => observable.map<number, number[]>());
  const [lastSelectedCell, setLastSelectedCell] = useState<IPosition | null>(null);

  const selectRow = useCallback(action((rowIdx: number, multiple: boolean, temporary = false) => {
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

    if (temporary) {
      temporarySelectedCells.set(rowIdx, rowSelection);
      return;
    }

    selectedCells.set(rowIdx, rowSelection);
  }), [selectedCells, modelResultData]);

  const isRowSelected = useCallback((rowIdx: number) => {
    if (!modelResultData) {
      throw new Error('Model result data must be provided');
    }

    const columnsLength = (modelResultData.data as SqlResultSet).columns?.length;

    return selectedCells.get(rowIdx)?.length === columnsLength;
  }, [modelResultData, selectedCells]);

  const unSelectRow = useCallback((rowIdx: number) => {
    selectedCells.delete(rowIdx);
  }, [selectedCells]);

  const selectRange = useCallback(action(
    (startPosition: IPosition, lastPosition: IPosition, multiple: boolean, temporary = false) => {
      temporarySelectedCells.clear();

      if (!multiple) {
        selectedCells.clear();
      }

      const left = Math.min(startPosition.idx, lastPosition.idx);
      const right = Math.max(startPosition.idx, lastPosition.idx);
      const top = Math.min(startPosition.rowIdx, lastPosition.rowIdx);
      const bottom = Math.max(startPosition.rowIdx, lastPosition.rowIdx);

      const rowSelection = [];
      for (let colIdx = left; colIdx <= right; colIdx++) {
        rowSelection.push(colIdx);
      }

      for (let rowIdx = top; rowIdx <= bottom; rowIdx++) {
        if (startPosition.isIndexColumn || lastPosition.isIndexColumn) {
          selectRow(rowIdx, true, temporary);
          continue;
        }
        if (temporary) {
          temporarySelectedCells.set(rowIdx, [...rowSelection]);
          continue;
        }

        const currentRowSelection = selectedCells.get(rowIdx) || [];
        selectedCells.set(rowIdx, [...new Set([...currentRowSelection, ...rowSelection])]);
      }

      options.select({ idx: lastPosition.idx, rowIdx: lastPosition.rowIdx });
    }), [selectedCells, temporarySelectedCells]);

  const isColumnSelected = useCallback((columnIndex: number, rowsLength: number) => {
    let result = true;

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      const rowSelection = selectedCells.get(rowIdx) || [];
      if (!rowSelection.includes(columnIndex)) {
        result = false;
        break;
      }
    }
    return result;
  }, [selectedCells]);

  const unSelectColumn = useCallback((columnIndex: number, rowsLength: number) => {
    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      const rowSelection = selectedCells.get(rowIdx) || [];
      selectedCells.set(rowIdx, [...rowSelection.filter(colIdx => colIdx !== columnIndex)]);
    }
  }, [selectedCells]);

  const selectColumn = useCallback(action((columnKey: string, multiple: boolean) => {
    if (!modelResultData) {
      throw new Error('Model result data must be provided');
    }

    if (!multiple) {
      selectedCells.clear();
    }

    const rowsLength = (modelResultData.data as SqlResultSet).rows?.length || 0;
    const columnIndex = getColumnIdxFromColumnKey(columnKey);

    if (isColumnSelected(columnIndex, rowsLength)) {
      unSelectColumn(columnIndex, rowsLength);
    } else {
      for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
        const rowSelection = selectedCells.get(rowIdx) || [];

        selectedCells.set(rowIdx, [...rowSelection, columnIndex]);
      }
    }
  }), [modelResultData, selectedCells, isColumnSelected, unSelectColumn]);

  const selectTable = useCallback(() => {
    if (!modelResultData) {
      throw new Error('Model result data must be provided');
    }

    const rowsLength = (modelResultData.data as SqlResultSet).rows?.length || 0;
    const columnsLength = (modelResultData.data as SqlResultSet).columns?.length || 0;

    const rowSelection = [];
    for (let colIdx = 0; colIdx < columnsLength; colIdx++) {
      rowSelection.push(colIdx);
    }

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      selectedCells.set(rowIdx, [...rowSelection]);
    }

    options.select({ idx: -1, rowIdx: 0 });
  }, [modelResultData, selectedCells, options]);

  const isSelected = useCallback((columnKey: string, rowIdx: number) => {
    if (!selectedCells.has(rowIdx) && !temporarySelectedCells.has(rowIdx)) {
      return false;
    }

    const rowSelection = selectedCells.get(rowIdx);
    const temporaryRowSelection = temporarySelectedCells.get(rowIdx);

    const idx = Number(columnKey);

    return !!(rowSelection?.includes(idx) || temporaryRowSelection?.includes(idx));
  },
  [selectedCells, temporarySelectedCells]);

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

  const select = useCallback((columnKey: string, rowIdx: number, multiple: boolean, range: boolean) => {
    const isIndexCol = isIndexColumn(columnKey);
    const columnIndex = getColumnIdxFromColumnKey(columnKey);

    setLastSelectedCell({ idx: columnIndex, rowIdx, isIndexColumn: isIndexCol });

    if (selectedCells.size > 0 && range && lastSelectedCell) {
      selectRange(
        {
          idx: lastSelectedCell.idx,
          rowIdx: lastSelectedCell.rowIdx,
          isIndexColumn: lastSelectedCell.isIndexColumn,
        },
        { idx: columnIndex, rowIdx, isIndexColumn: isIndexCol },
        multiple);
      return;
    }

    if (isIndexCol) {
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

    if (isSelected(columnKey, rowIdx)) {
      unSelect(columnIndex, rowIdx);
      return;
    }

    selectCell(columnIndex, rowIdx);
  }, [
    selectedCells,
    selectRow,
    selectRange,
    unSelect,
    isSelected,
    selectCell,
    isRowSelected,
    unSelectRow,
    lastSelectedCell,
  ]);

  const context: IDataGridSelectionContext = useMemo(() => ({
    selectedCells,
    select,
    selectRange,
    selectColumn,
    selectTable,
    isSelected,
  }), [selectedCells, select, isSelected, selectRange, selectColumn, selectTable]);

  return context;
}
