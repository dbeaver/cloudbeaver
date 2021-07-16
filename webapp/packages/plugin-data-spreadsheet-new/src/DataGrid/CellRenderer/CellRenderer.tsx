/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import type { CellRendererProps } from 'react-data-grid';
import { Cell } from 'react-data-grid';

import { useMouse, useObjectRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { isBooleanFormatterAvailable } from '../Formatters/CellFormatters/isBooleanFormatterAvailable';
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
  const resultColumn = tableDataContext?.getColumnInfo(column.key);
  const editor = dataGridContext?.model.source.getEditor(dataGridContext.resultIndex);

  const classes: string[] = [];

  if (selectionContext?.isSelected(rowIdx, column.idx)) {
    classes.push('rdg-cell-custom-selected');
  }

  if (editingContext?.isEditing({ idx: column.idx, rowIdx })) {
    classes.push('rdg-cell-custom-editing');
  }

  if (!tableDataContext?.isIndexColumn(column.key) && editor?.isCellEdited(rowIdx, Number(column.key))) {
    classes.push('rdg-cell-custom-edited');
  }

  const state = useObjectRef({
    row: props.row,
    column,
    rowIdx,
    resultColumn,
    isCellSelected,
    editor,
    selectionContext,
    dataGridContext,
    editingContext,
    tableDataContext,
    get immutableRow() {
      return this.editor?.get(this.rowIdx) || this.row; // performance heavy
    },
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
      if (!this.dataGridContext?.isGridInFocus() || EventContext.has(event, EventStopPropagationFlag)) {
        return;
      }

      this.selectionContext?.select(
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
      if (EventContext.has(event, EventStopPropagationFlag)) {
        return;
      }

      if (
        !this.column.editable
        || this.dataGridContext?.model.isDisabled(this.dataGridContext.resultIndex)
        || (
          this.resultColumn
          && isBooleanFormatterAvailable(this.editor?.getCell(this.rowIdx, Number(this.column.key)), this.resultColumn)
        )
      ) {
        return;
      }
      const format = this.dataGridContext?.model.source.getAction(
        this.dataGridContext.resultIndex,
        ResultSetFormatAction
      );
      const columnIndex = this.tableDataContext?.getDataColumnIndexFromKey(this.column.key) ?? null;

      if (
        columnIndex === null
        || format?.isReadOnly({
          row: this.rowIdx,
          column: columnIndex,
        })
      ) {
        return;
      }

      this.editingContext?.edit({ idx: this.column.idx, rowIdx: this.rowIdx });
    },
  }, {
    row: props.row,
    column,
    rowIdx,
    resultColumn,
    isCellSelected,
    editor,
    selectionContext,
    dataGridContext,
    editingContext,
    tableDataContext,
  }, {
    rowIdx: observable.ref,
    row: observable.ref,
    editor: observable.ref,
    immutableRow: computed,
  }, ['doubleClick', 'mouseUp', 'mouseDown']);

  return (
    <CellContext.Provider value={cellContext}>{/** performance super heavy */}
      <Cell
        ref={mouse.reference}
        className={classes.join(' ')}
        data-row-index={rowIdx}
        data-column-index={column.idx}
        onMouseDown={state.mouseDown}
        onMouseUp={state.mouseUp}
        onDoubleClick={state.doubleClick}
        {...props}
        row={state.immutableRow}
      />
    </CellContext.Provider>
  );
});
