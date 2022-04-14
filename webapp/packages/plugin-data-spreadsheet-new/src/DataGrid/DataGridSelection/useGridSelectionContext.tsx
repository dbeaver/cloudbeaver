/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey, ResultSetDataKeysUtils, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../TableDataContext';
import type { IDraggingPosition } from '../useGridDragging';
import type { IDataGridSelectionContext } from './DataGridSelectionContext';

interface IGridSelectionState {
  range: boolean;
  temporarySelection: Map<string, IResultSetElementKey[]>;
  lastSelectedCell: IDraggingPosition | null;
}

export function useGridSelectionContext(
  tableData: ITableData,
  selectionAction: ResultSetSelectAction
): IDataGridSelectionContext {
  const props = useObjectRef({ tableData, selectionAction });

  const [state] = useState<IGridSelectionState>(() => observable({
    range: false,
    temporarySelection: new Map<string, IResultSetElementKey[]>(),
    lastSelectedCell: null,
  }));

  const selectRows = action(function selectRows(
    startRow: IResultSetRowKey,
    lastRow: IResultSetRowKey,
    columns: IResultSetColumnKey[] = [],
    multiple = false,
    temporary = false
  ) {
    const { selectionAction } = props;
    const { temporarySelection } = state;

    const startPosition = props.tableData.getRowIndexFromKey(startRow);
    const lastPosition = props.tableData.getRowIndexFromKey(lastRow);

    const firstRowIndex = Math.min(startPosition, lastPosition);
    const lastRowIndex = Math.max(startPosition, lastPosition);

    let selected = true;
    const rowsSelection: IResultSetElementKey[][] = [];
    const columnsToSelect: Array<IResultSetColumnKey | undefined> = columns.length > 0 ? columns : [undefined];

    for (let rowIndex = firstRowIndex; rowIndex <= lastRowIndex; rowIndex++) {
      const row = props.tableData.getRow(rowIndex);

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
        for (const column of props.tableData.columns) {
          if (column.columnDataIndex !== null) {
            rowSelection.push(column.columnDataIndex);
          }
        }
      }

      let i = 0;
      for (let rowIdx = firstRowIndex; rowIdx <= lastRowIndex; rowIdx++) {
        const row = props.tableData.getRow(rowIdx);
        const newElements = rowSelection
          .filter(
            element => !rowsSelection[i]
              .some(column => ResultSetDataKeysUtils.isEqual(column.column, element))
          )
          .map<IResultSetElementKey>(column => ({ row, column }));

        temporarySelection.set(ResultSetDataKeysUtils.serialize(row),
          [...rowsSelection[i], ...newElements]
            .filter(column => {
              if (selected) {
                return !rowSelection.some(key => ResultSetDataKeysUtils.isEqual(key, column.column));
              }
              return true;
            }));
        i++;
      }
      return;
    }

    for (let rowIndex = firstRowIndex; rowIndex <= lastRowIndex; rowIndex++) {
      const row = props.tableData.getRow(rowIndex);

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
    const startRow = props.tableData.getRow(startPosition.rowIdx);
    const lastRow = props.tableData.getRow(lastPosition.rowIdx);

    selectRows(
      startRow,
      lastRow,
      isIndexColumnInRange
        ? undefined
        : (columnsInRange
          .filter(column => column.columnDataIndex !== null)
          .map(column => column.columnDataIndex!)),
      multiple,
      temporary
    );
  }

  const selectColumn = action(function selectColumn(
    colIdx: number,
    multiple: boolean
  ) {
    const { selectionAction, tableData } = props;

    state.temporarySelection.clear();

    const column = tableData
      .getColumn(colIdx)
      .columnDataIndex ?? undefined;

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
    const column = props.tableData
      .getColumn(colIdx)
      .columnDataIndex ?? undefined;

    const row = props.tableData.getRow(rowIdx);

    const temporaryRowSelection = state.temporarySelection.get(ResultSetDataKeysUtils.serialize(row));

    if (temporaryRowSelection) {
      if (column === undefined) {
        return (temporaryRowSelection || []).length === props.tableData.columnKeys.length;
      }
      return temporaryRowSelection.some(key => ResultSetDataKeysUtils.isEqual(key.column, column));
    }

    return props.selectionAction.isElementSelected({ row, column });
  }

  function selectCell(key: IResultSetElementKey, multiple: boolean) {
    const { temporarySelection } = state;
    const { selectionAction } = props;
    temporarySelection.clear();

    const selected = selectionAction.isElementSelected(key);

    if (!multiple) {
      selectionAction.clear();
      return;
    }

    const focusedElement = selectionAction.getFocusedElement();

    if (selectionAction.elements.length === 0 && focusedElement) {
      selectionAction.set(focusedElement, true);
    }

    selectionAction.set(key, !selected);
  }

  function select(cell: IDraggingPosition, multiple: boolean, range: boolean, temporary: boolean) {
    const { lastSelectedCell } = state;

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

    const column = props.tableData.getColumn(cell.colIdx);
    const isIndexColumn = props.tableData.isIndexColumn(column.key);
    const row = props.tableData.getRow(cell.rowIdx);

    if (isIndexColumn) {
      selectRows(row, row, undefined, multiple, temporary);
      return;
    }

    if (column.columnDataIndex !== null) {
      selectCell({ row, column: column.columnDataIndex }, multiple);
    }
  }

  return useObjectRef<IDataGridSelectionContext>(() => ({
    get selectedCells() {
      return props.selectionAction.selectedElements;
    },
    select,
    selectColumn,
    selectTable,
    isSelected,
    selectRange,
  }), false);
}
