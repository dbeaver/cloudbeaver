/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect } from 'react';

import { getComputed, useCombinedHandler, useMouse, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { clsx } from '@cloudbeaver/core-utils';
import { DatabaseEditChangeType, IResultSetElementKey, IResultSetRowKey, isBooleanValuePresentationAvailable } from '@cloudbeaver/plugin-data-viewer';
import { CalculatedColumn, Cell, CellRendererProps } from '@cloudbeaver/plugin-react-data-grid';

import { CellPosition, EditingContext } from '../../Editing/EditingContext';
import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';
import { CellContext } from './CellContext';

export const CellRenderer = observer<CellRendererProps<IResultSetRowKey, unknown>>(function CellRenderer(props) {
  const { rowIdx, row, column, isCellSelected, onDoubleClick, selectCell } = props;
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const editingContext = useContext(EditingContext);
  const mouse = useMouse<HTMLDivElement>({});

  const cellContext = useObservableRef(
    () => ({
      mouse,
      get position(): CellPosition {
        return { idx: this.column.idx, rowIdx: this.rowIdx };
      },
      get cell(): IResultSetElementKey | undefined {
        if (this.column.columnDataIndex === null) {
          return undefined;
        }
        return { row: this.row, column: this.column.columnDataIndex };
      },
      get isEditing(): boolean {
        return editingContext.isEditing(this.position) || false;
      },
      get isSelected(): boolean {
        return selectionContext.isSelected(this.position.rowIdx, this.position.idx) || false;
      },
      get isFocused(): boolean {
        return this.isEditing ? false : this.isCellSelected;
      },
      get editionState(): DatabaseEditChangeType | null {
        if (!this.cell) {
          return null;
        }

        return tableDataContext.getEditionState(this.cell);
      },
    }),
    {
      row: observable.ref,
      column: observable.ref,
      rowIdx: observable.ref,
      isCellSelected: observable.ref,
      position: computed,
      cell: computed,
      isEditing: computed,
      isSelected: computed,
      isFocused: computed,
      editionState: computed,
    },
    { row, column, rowIdx, isCellSelected },
  );

  const classes = getComputed(() =>
    clsx({
      'rdg-cell-custom-selected': cellContext.isSelected,
      'rdg-cell-custom-editing': cellContext.isEditing,
      'rdg-cell-custom-added': cellContext.editionState === DatabaseEditChangeType.add,
      'rdg-cell-custom-deleted': cellContext.editionState === DatabaseEditChangeType.delete,
      'rdg-cell-custom-edited': cellContext.editionState === DatabaseEditChangeType.update,
    }),
  );

  function isEditable(column: CalculatedColumn<IResultSetRowKey>): boolean {
    if (!cellContext.cell) {
      return false;
    }

    if (tableDataContext.format.isBinary(cellContext.cell)) {
      return false;
    }

    const resultColumn = tableDataContext.getColumnInfo(cellContext.cell.column);
    const value = tableDataContext.getCellValue(cellContext.cell);

    if (!resultColumn || value === undefined) {
      return false;
    }

    const handleByBooleanFormatter = isBooleanValuePresentationAvailable(value, resultColumn);

    return !(handleByBooleanFormatter || tableDataContext.isCellReadonly(cellContext.cell));
  }

  const state = useObjectRef(
    () => ({
      mouseDown(event: React.MouseEvent<HTMLDivElement>) {
        // this.selectCell(this.row, this.column);
      },
      mouseUp(event: React.MouseEvent<HTMLDivElement>) {
        if (
          // !this.dataGridContext.isGridInFocus()
          EventContext.has(event, EventStopPropagationFlag)
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
          false,
        );
      },
      doubleClick(args: any, event: React.MouseEvent<HTMLDivElement>) {
        if (
          !this.isEditable(this.column) ||
          // !this.dataGridContext.isGridInFocus()
          EventContext.has(event, EventStopPropagationFlag)
        ) {
          return;
        }

        this.editingContext.edit(cellContext.position);
      },
    }),
    {
      row,
      column,
      rowIdx,
      selectionContext,
      dataGridContext,
      editingContext,
      isEditable,
      selectCell,
    },
    ['doubleClick', 'mouseUp', 'mouseDown'],
  );

  useEffect(() => () => editingContext.closeEditor(cellContext.position), []);
  const handleDoubleClick = useCombinedHandler(state.doubleClick, onDoubleClick);

  return (
    <CellContext.Provider value={cellContext}>
      <Cell
        ref={mouse.reference}
        className={classes}
        data-row-index={rowIdx}
        data-column-index={column.idx}
        onMouseDown={state.mouseDown}
        onMouseUp={state.mouseUp}
        {...props}
        onDoubleClick={handleDoubleClick}
      />
    </CellContext.Provider>
  );
});
