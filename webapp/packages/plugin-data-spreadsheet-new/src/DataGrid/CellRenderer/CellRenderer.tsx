/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import type { CellRendererProps } from 'react-data-grid';
import { Cell } from 'react-data-grid';

import { useMouse, useObjectRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { IResultSetElementKey, IResultSetRowKey, isBooleanValuePresentationAvailable, ResultSetChangeType } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';
import { CellContext, ICellContext } from './CellContext';

export const CellRenderer: React.FC<CellRendererProps<IResultSetRowKey>> = observer(function CellRenderer(props) {
  const { rowIdx, row, column, isCellSelected } = props;
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const editingContext = useContext(EditingContext);
  const mouse = useMouse<HTMLDivElement>({});
  const cellContext = useMemo<ICellContext>(() => ({ mouse }), [mouse]);

  let classes = '';
  const cellKey: IResultSetElementKey | undefined = column.columnDataIndex !== null
    ? { row, column: column.columnDataIndex }
    : undefined;

  if (selectionContext?.isSelected(rowIdx, column.idx)) {
    classes += ' rdg-cell-custom-selected';
  }

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    classes += ' rdg-cell-custom-editing';
  }

  if (cellKey && tableDataContext?.isCellEdited(cellKey)) {
    switch (tableDataContext.getEditionState(cellKey)) {
      case ResultSetChangeType.add:
        classes += ' rdg-cell-custom-added';
        break;
      case ResultSetChangeType.delete:
        classes += ' rdg-cell-custom-deleted';
        break;
      case ResultSetChangeType.update:
        classes += ' rdg-cell-custom-edited';
    }
  }

  const state = useObjectRef({
    column,
    rowIdx,
    cellKey,
    isCellSelected,
    selectionContext,
    dataGridContext,
    editingContext,
    tableDataContext,
    mouseDown(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      if (EventContext.has(event, EventStopPropagationFlag)) {
        return;
      }

      const dataGridApi = this.dataGridContext?.getDataGridApi();

      if (dataGridApi && !this.isCellSelected) {
        dataGridApi.selectCell({ idx: this.column.idx, rowIdx: this.rowIdx });
      }

      this.selectionContext?.select(
        {
          colIdx: this.column.idx,
          rowIdx: this.rowIdx,
        },
        event.ctrlKey || event.metaKey,
        event.shiftKey,
        true
      );
    },
    mouseUp(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      if (
        !this.selectionContext
        || !this.dataGridContext?.isGridInFocus()
        || EventContext.has(event, EventStopPropagationFlag)
      ) {
        return;
      }

      this.selectionContext.select(
        {
          colIdx: this.column.idx,
          rowIdx: this.rowIdx,
        },
        event.ctrlKey || event.metaKey,
        event.shiftKey,
        false
      );
    },
    doubleClick(event: React.MouseEvent<HTMLDivElement>) {
      if (
        !this.editingContext
        || !this.tableDataContext
        || EventContext.has(event, EventStopPropagationFlag)
        || !this.cellKey
      ) {
        return;
      }

      const resultColumn = this.tableDataContext.getColumnInfo(this.cellKey.column);
      const value = this.tableDataContext.getCellValue(this.cellKey);

      if (!resultColumn || value === undefined) {
        return;
      }

      const handleByBooleanFormatter = isBooleanValuePresentationAvailable(value, resultColumn);

      if (
        !this.column.editable
        || handleByBooleanFormatter
        || this.tableDataContext.format.isReadOnly(this.cellKey)
      ) {
        return;
      }

      this.editingContext.edit({
        idx: this.column.idx,
        rowIdx: this.rowIdx,
      });
    },
  }, {
    column,
    rowIdx,
    cellKey,
    isCellSelected,
    selectionContext,
    dataGridContext,
    editingContext,
    tableDataContext,
  }, undefined, ['doubleClick', 'mouseUp', 'mouseDown']);

  return (
    <CellContext.Provider value={cellContext}>{/** performance super heavy */}
      <Cell
        ref={mouse.reference}
        className={classes}
        data-row-index={rowIdx}
        data-column-index={column.idx}
        onMouseDown={state.mouseDown}
        onMouseUp={state.mouseUp}
        onDoubleClick={state.doubleClick}
        {...props}
      />
    </CellContext.Provider>
  );
});
