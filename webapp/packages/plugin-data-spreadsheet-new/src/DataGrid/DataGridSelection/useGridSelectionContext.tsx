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
import type { IResultSetElementKey, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../TableDataContext';
import type { IDraggingPosition } from '../useGridDragging';
import type { IDataGridSelectionContext } from './DataGridSelectionContext';

interface IGridSelectionState {
  range: boolean;
  temporarySelection: Map<number, number[]>;
  lastSelectedCell: IDraggingPosition | null;
}

export function useGridSelectionContext(
  tableData: ITableData,
  selectionAction: ResultSetSelectAction
): IDataGridSelectionContext {
  const props = useObjectRef({ tableData, selectionAction });

  const [state] = useState<IGridSelectionState>(() => observable({
    range: false,
    temporarySelection: new Map<number, number[]>(),
    lastSelectedCell: null,
  }));

  function getRealColumnIndex(colIdx: number) {
    let column: number | undefined = props.tableData.getColumnKeyFromColumnIndex(colIdx);

    if (props.tableData.isIndexColumn(column)) {
      column = undefined;
    }

    return column;
  }

  const selectRows = action(function selectRows(
    startPosition: number,
    lastPosition: number,
    columns: number[] = [],
    multiple = false,
    temporary = false
  ) {
    const { selectionAction } = props;
    const { temporarySelection } = state;

    const columnsLength = props.tableData.dataColumns.length;
    const firstRow = Math.min(startPosition, lastPosition);
    const lastRow = Math.max(startPosition, lastPosition);

    let selected = true;
    const rowsSelection: number[][] = [];
    const columnsToSelect: Array<number| undefined> = columns.length > 0 ? columns : [undefined];

    for (let row = firstRow; row <= lastRow; row++) {
      for (const column of columnsToSelect) {
        if (!selectionAction.isElementSelected({ row, column })) {
          selected = false;
          break;
        }
      }
      rowsSelection.push(selectionAction.getRowSelection(row));
    }

    temporarySelection.clear();

    if (!multiple) {
      selectionAction.clear();
    }

    if (temporary) {
      const rowSelection = columns;

      if (columns.length === 0) {
        for (let i = 0; i < columnsLength; i++) {
          rowSelection.push(i);
        }
      }

      let i = 0;
      for (let rowIdx = firstRow; rowIdx <= lastRow; rowIdx++) {
        const newElements = rowSelection.filter(element => !rowsSelection[i].includes(element));

        temporarySelection.set(rowIdx,
          [...rowsSelection[i], ...newElements]
            .filter(column => {
              if (selected) {
                return !rowSelection.includes(column);
              }
              return true;
            }));
        i++;
      }
      return;
    }

    for (let row = firstRow; row <= lastRow; row++) {
      for (const column of columnsToSelect) {
        selectionAction.set({ row, column }, !selected);
      }
    }
  });

  function selectRange(
    startPosition: IDraggingPosition,
    lastPosition: IDraggingPosition,
    multiple: boolean,
    temporary = false
  ) {
    state.range = temporary;
    const columnsInRange = props.tableData.getColumnsInRange(startPosition.colIdx, lastPosition.colIdx);
    const isIndexColumnInRange = props.tableData.isIndexColumnInRange(columnsInRange);

    selectRows(
      startPosition.rowIdx,
      lastPosition.rowIdx,
      isIndexColumnInRange ? undefined : columnsInRange.map(column => Number(column.key)),
      multiple,
      temporary
    );
  }

  const selectColumn = action(function selectColumn(
    colIdx: number,
    multiple: boolean
  ) {
    state.temporarySelection.clear();
    const column = getRealColumnIndex(colIdx);

    const { selectionAction } = props;
    const selected = selectionAction.isElementSelected({ column });

    if (!multiple) {
      selectionAction.clear();
    }

    selectionAction.set({ column }, !selected);
  });

  function selectTable() {
    state.temporarySelection.clear();
    props.selectionAction.set({}, true);
  }

  function isSelected(rowIdx: number, colIdx: number) {
    const column = getRealColumnIndex(colIdx);

    const temporaryRowSelection = state.temporarySelection.get(rowIdx);

    if (temporaryRowSelection) {
      if (column === undefined) {
        return (temporaryRowSelection || []).length === props.tableData.dataColumns.length;
      }
      return temporaryRowSelection.includes(column) || false;
    }

    return props.selectionAction.isElementSelected({ row: rowIdx, column });
  }

  function selectCell(rowIdx: number, columnIdx: number, multiple: boolean, temporary: boolean) {
    const { temporarySelection } = state;
    const { selectionAction } = props;
    temporarySelection.clear();

    const key: IResultSetElementKey = {
      column: columnIdx,
      row: rowIdx,
    };

    const selectedColumns = selectionAction.getRowSelection(rowIdx);
    const selected = selectionAction.isElementSelected(key);

    if (!multiple) {
      selectionAction.clear();
    }

    if (temporary) {
      temporarySelection.set(
        rowIdx,
        [...selectedColumns, columnIdx]
          .filter(column => {
            if (!multiple) {
              return column === columnIdx;
            }
            if (selected) {
              return column !== columnIdx;
            }
            return true;
          })
      );
    } else {
      selectionAction.set(key, !selected);
    }
  }

  function select(cell: IDraggingPosition, multiple: boolean, range: boolean, temporary: boolean) {
    const { lastSelectedCell } = state;
    const columnKey = props.tableData.getColumnKeyFromColumnIndex(cell.colIdx);
    const isIndexColumn = props.tableData.isIndexColumn(columnKey);

    if (!temporary) {
      state.lastSelectedCell = cell;
    }

    if (range && lastSelectedCell) {
      selectRange(lastSelectedCell, cell, multiple, temporary);
      return;
    }

    if (state.range) {
      return;
    }

    if (isIndexColumn) {
      selectRows(cell.rowIdx, cell.rowIdx, undefined, multiple, temporary);
      return;
    }

    selectCell(cell.rowIdx, columnKey, multiple, temporary);
  }

  return useObjectRef<IDataGridSelectionContext>({
    get selectedCells() {
      return props.selectionAction.selectedElements;
    },
    select,
    selectColumn,
    selectTable,
    isSelected,
    selectRange,
  }, {});
}
