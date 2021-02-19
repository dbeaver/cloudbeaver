/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useCallback, useMemo, useState } from 'react';

import type { ITableData } from '../TableDataContext';
import type { IDataGridSelectionContext } from './DataGridSelectionContext';

export interface IPosition {
  idx: number;
  rowIdx: number;
}

export function useGridSelectionContext(tableData: ITableData) {
  const [selectedCells] = useState(() => observable.map<number, number[]>());
  const [temporarySelectedCells] = useState(() => observable.map<number, number[]>());
  const [lastSelectedCell, setLastSelectedCell] = useState<IPosition | null>(null);

  const selectRows = useCallback(action(
    (startPosition: number, lastPosition: number, multiple: boolean, temporary = false) => {
      const columnsLength = tableData.columns?.length || 0;

      temporarySelectedCells.clear();

      if (!multiple) {
        selectedCells.clear();
      }

      const rowSelection = [];
      for (let i = 0; i < columnsLength; i++) {
        rowSelection.push(i);
      }

      const firstRowIdx = Math.min(startPosition, lastPosition);
      const lastRowIdx = Math.max(startPosition, lastPosition);

      for (let rowIdx = firstRowIdx; rowIdx <= lastRowIdx; rowIdx++) {
        if (selectedCells.get(rowIdx)?.length === columnsLength) {
          selectedCells.delete(rowIdx);
          continue;
        }

        if (temporary) {
          temporarySelectedCells.set(rowIdx, rowSelection);
        } else {
          selectedCells.set(rowIdx, rowSelection);
        }
      }
    }), [selectedCells, temporarySelectedCells]);

  const selectRange = useCallback(action(
    (startPosition: number, lastPosition: number, columns: number[], multiple: boolean, temporary = false) => {
      temporarySelectedCells.clear();

      if (!multiple) {
        selectedCells.clear();
      }

      const top = Math.min(startPosition, lastPosition);
      const bottom = Math.max(startPosition, lastPosition);

      for (let rowIdx = top; rowIdx <= bottom; rowIdx++) {
        if (temporary) {
          temporarySelectedCells.set(rowIdx, [...columns]);
        } else {
          const currentRowSelection = selectedCells.get(rowIdx) || [];
          const newRowSelection = [...currentRowSelection, ...columns]
            .filter((columnIdx, idx, arr) => arr.indexOf(columnIdx) === idx);

          selectedCells.set(rowIdx, newRowSelection);
        }
      }
    }), [selectedCells, temporarySelectedCells]);

  const updateMultiSelection = useCallback(
    (startPosition: IPosition, lastPosition: IPosition, multiple: boolean, temporary: boolean) => {
      const columnsInRange = tableData.getColumnsInRange(startPosition.idx, lastPosition.idx);
      const isIndexColumnInRange = tableData.isIndexColumnInRange(columnsInRange);

      if (isIndexColumnInRange) {
        selectRows(startPosition.rowIdx, lastPosition.rowIdx, multiple, temporary);
      } else {
        selectRange(
          startPosition.rowIdx,
          lastPosition.rowIdx,
          columnsInRange.map(column => Number(column.key)),
          multiple,
          temporary
        );
      }
    }, [selectRange, selectRows, tableData]);

  const isColumnSelected = useCallback((columnIndex: number) => {
    const rowsLength = tableData.rows?.length || 0;

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      const rowSelection = selectedCells.get(rowIdx) || [];
      if (!rowSelection.includes(columnIndex)) {
        return false;
      }
    }
    return true;
  }, [selectedCells, tableData]);

  const selectColumn = useCallback(action((columnKey: string, multiple: boolean) => {
    const columnIndex = Number(columnKey);
    const isSelected = isColumnSelected(columnIndex);

    if (!multiple) {
      selectedCells.clear();
    }

    const rowsLength = tableData.rows?.length || 0;

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      const rowSelection = selectedCells.get(rowIdx) || [];
      if (isSelected) {
        selectedCells.set(rowIdx, [...rowSelection.filter(colIdx => colIdx !== columnIndex)]);
      } else {
        selectedCells.set(rowIdx, [...rowSelection, columnIndex]);
      }
    }
  }), [tableData, selectedCells, isColumnSelected]);

  const selectTable = useCallback(() => {
    const rowsLength = tableData.rows?.length || 0;
    const columnsLength = tableData.columns?.length || 0;

    const rowSelection = [];
    for (let colIdx = 0; colIdx < columnsLength; colIdx++) {
      rowSelection.push(colIdx);
    }

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      selectedCells.set(rowIdx, [...rowSelection]);
    }
  }, [tableData, selectedCells]);

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

  const selectCell = useCallback((columnIdx: number, rowIdx: number) => {
    const rowSelection = selectedCells.get(rowIdx);
    if (rowSelection === undefined) {
      selectedCells.set(rowIdx, [columnIdx]);
      return;
    }

    const targetIndex = rowSelection.indexOf(columnIdx);

    if (targetIndex !== -1) {
      rowSelection.splice(targetIndex, 1);
      return;
    }

    rowSelection.push(columnIdx);
  }, [selectedCells]);

  const select = useCallback(
    (columnIndex: number, rowIdx: number, multiple: boolean, range: boolean) => {
      const columnKey = tableData.getColumnKeyFromColumnIndex(columnIndex);
      const isIndexColumn = tableData.isIndexColumn(columnKey);

      setLastSelectedCell({ idx: columnIndex, rowIdx });

      if (selectedCells.size > 0 && range && lastSelectedCell) {
        updateMultiSelection(
          { idx: lastSelectedCell.idx, rowIdx: lastSelectedCell.rowIdx },
          { idx: columnIndex, rowIdx },
          multiple,
          false);
        return;
      }

      if (isIndexColumn) {
        selectRows(rowIdx, rowIdx, multiple);
        return;
      }

      if (!multiple) {
        selectedCells.clear();
      }

      selectCell(Number(columnKey), rowIdx);
    }, [
      tableData,
      selectedCells,
      selectRows,
      selectCell,
      lastSelectedCell,
      updateMultiSelection,
    ]);

  const context: IDataGridSelectionContext = useMemo(() => ({
    selectedCells,
    select,
    selectColumn,
    selectTable,
    isSelected,
    updateMultiSelection,
  }), [selectedCells, select, isSelected, selectColumn, selectTable, updateMultiSelection]);

  return context;
}
