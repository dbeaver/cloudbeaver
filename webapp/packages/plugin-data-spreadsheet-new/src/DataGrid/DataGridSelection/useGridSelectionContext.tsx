/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { ITableData } from '../TableDataContext';
import type { IDataGridSelectionContext } from './DataGridSelectionContext';

export interface IPosition {
  idx: number;
  rowIdx: number;
}

interface IGridSelectionState {
  selectedCells: Map<number, number[]>;
  temporarySelectedCells: Map<number, number[]>;
  lastSelectedCell: IPosition | null;
}

export function useGridSelectionContext(tableData: ITableData): IDataGridSelectionContext {
  const props = useObjectRef({ tableData });

  const [state] = useState<IGridSelectionState>(() => observable({
    selectedCells: new Map<number, number[]>(),
    temporarySelectedCells: new Map<number, number[]>(),
    lastSelectedCell: null,
  }));

  const selectRows = action(function selectRows(
    startPosition: number,
    lastPosition: number,
    multiple: boolean,
    temporary = false
  ) {
    const { temporarySelectedCells, selectedCells } = state;
    const columnsLength = props.tableData.dataColumns.length;

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
  });

  const selectRange = action(function selectRange(
    startPosition: number,
    lastPosition: number,
    columns: number[],
    multiple: boolean,
    temporary = false
  ) {
    const { temporarySelectedCells, selectedCells } = state;
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
  });

  function updateMultiSelection(
    startPosition: IPosition,
    lastPosition: IPosition,
    multiple: boolean,
    temporary: boolean
  ) {
    const columnsInRange = props.tableData.getColumnsInRange(startPosition.idx, lastPosition.idx);
    const isIndexColumnInRange = props.tableData.isIndexColumnInRange(columnsInRange);

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
  }

  function isColumnSelected(columnIndex: number) {
    const rowsLength = props.tableData.dataRows.length;

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      const rowSelection = state.selectedCells.get(rowIdx) || [];
      if (!rowSelection.includes(columnIndex)) {
        return false;
      }
    }
    return true;
  }

  const selectColumn = action(function selectColumn(
    columnKey: string,
    multiple: boolean
  ) {
    const { selectedCells } = state;
    const columnIndex = Number(columnKey);
    const isSelected = isColumnSelected(columnIndex);

    if (!multiple) {
      selectedCells.clear();
    }

    const rowsLength = props.tableData.dataRows.length;

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      const rowSelection = selectedCells.get(rowIdx) || [];
      if (isSelected) {
        selectedCells.set(rowIdx, [...rowSelection.filter(colIdx => colIdx !== columnIndex)]);
      } else {
        selectedCells.set(rowIdx, [...rowSelection, columnIndex]);
      }
    }
  });

  function selectTable() {
    const rowsLength = props.tableData.dataRows.length;
    const columnsLength = props.tableData.dataColumns.length;

    const rowSelection = [];
    for (let colIdx = 0; colIdx < columnsLength; colIdx++) {
      rowSelection.push(colIdx);
    }

    for (let rowIdx = 0; rowIdx < rowsLength; rowIdx++) {
      state.selectedCells.set(rowIdx, [...rowSelection]);
    }
  }

  function isSelected(columnKey: string, rowIdx: number) {
    const { selectedCells, temporarySelectedCells } = state;
    if (!selectedCells.has(rowIdx) && !temporarySelectedCells.has(rowIdx)) {
      return false;
    }

    const rowSelection = selectedCells.get(rowIdx);
    const temporaryRowSelection = temporarySelectedCells.get(rowIdx);

    const idx = Number(columnKey);

    return !!(rowSelection?.includes(idx) || temporaryRowSelection?.includes(idx));
  }

  function selectCell(columnIdx: number, rowIdx: number) {
    const { selectedCells } = state;
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
  }

  function select(columnIndex: number, rowIdx: number, multiple: boolean, range: boolean) {
    const { selectedCells, lastSelectedCell } = state;
    const columnKey = props.tableData.getColumnKeyFromColumnIndex(columnIndex);
    const isIndexColumn = props.tableData.isIndexColumn(columnKey);

    state.lastSelectedCell = { idx: columnIndex, rowIdx };

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
  }

  return useObjectRef<IDataGridSelectionContext>({
    selectedCells: state.selectedCells,
    select,
    selectColumn,
    selectTable,
    isSelected,
    updateMultiSelection,
  }, {});
}
