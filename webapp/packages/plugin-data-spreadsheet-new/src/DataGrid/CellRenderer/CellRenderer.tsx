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
import { isBooleanValuePresentationAvailable } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';
import { CellContext, ICellContext } from './CellContext';

export const CellRenderer: React.FC<CellRendererProps<any>> = observer(function CellRenderer(props) {
  const { rowIdx, column, isCellSelected } = props;
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const editingContext = useContext(EditingContext);
  const mouse = useMouse<HTMLDivElement>({});
  const cellContext = useMemo<ICellContext>(() => ({ mouse }), [mouse]);

  let classes = '';

  if (selectionContext?.isSelected(rowIdx, column.idx)) {
    classes += ' rdg-cell-custom-selected';
  }

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    classes += ' rdg-cell-custom-editing';
  }

  if (tableDataContext?.isCellEdited(rowIdx, column)) {
    classes += ' rdg-cell-custom-edited';
  }

  const state = useObjectRef({
    column,
    rowIdx,
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
      const columnIndex = this.column.columnDataIndex;

      if (
        !this.editingContext
        || !this.tableDataContext
        || EventContext.has(event, EventStopPropagationFlag)
        || columnIndex === null
      ) {
        return;
      }

      const resultColumn = this.tableDataContext.getColumnInfo(columnIndex);
      const value = this.tableDataContext.getCellValue(this.rowIdx, columnIndex);

      if (!resultColumn || value === undefined) {
        return;
      }

      const handleByBooleanFormatter = isBooleanValuePresentationAvailable(value, resultColumn);

      if (
        !this.column.editable
        || handleByBooleanFormatter
        || this.tableDataContext.format.isReadOnly({
          row: this.rowIdx,
          column: columnIndex,
        })
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
