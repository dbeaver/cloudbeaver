/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, type HTMLAttributes } from 'react';

import { getComputed, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { clsx } from '@dbeaver/ui-kit';
import { type IDataGridCellRenderer, type ICellPosition } from '@cloudbeaver/plugin-data-grid';
import { DatabaseEditChangeType, type IResultSetElementKey, type IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext } from '../DataGridContext.js';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext.js';
import { TableDataContext, type IColumnInfo } from '../TableDataContext.js';
import { CellContext } from './CellContext.js';

interface Props {
  rowIdx: number;
  colIdx: number;
  props: HTMLAttributes<HTMLDivElement>;
  renderDefaultCell: IDataGridCellRenderer;
}

export const CellRenderer = observer<Props>(function CellRenderer({ rowIdx, colIdx, props, renderDefaultCell }) {
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const selectionContext = useContext(DataGridSelectionContext);

  const cellContext = useObservableRef(
    () => ({
      isHovered: false,
      get position(): ICellPosition {
        return { colIdx: this.colIdx, rowIdx: this.rowIdx };
      },
      get column(): IColumnInfo {
        return this.tableDataContext.getColumn(this.colIdx)!;
      },
      get row(): IResultSetRowKey | undefined {
        return this.tableDataContext.getRow(this.rowIdx);
      },
      get cell(): IResultSetElementKey | undefined {
        if (this.column.key === null || this.row === undefined) {
          return undefined;
        }
        return { row: this.row, column: this.column.key };
      },
      get isFocused(): boolean {
        return this.props['aria-selected'] === 'true';
      },
      get isSelected(): boolean {
        return this.selectionContext.isSelected(this.position.rowIdx, this.position.colIdx) || false;
      },
      get hasFocusedElementInRow(): boolean {
        const focusedElement = this.focusedElementPosition;
        return focusedElement?.rowIdx === this.position.rowIdx;
      },
      get focusedElementPosition() {
        return this.selectionContext.getFocusedElementPosition();
      },
      get editionState(): DatabaseEditChangeType | null {
        if (!this.cell) {
          return null;
        }

        return this.tableDataContext.getEditionState(this.cell);
      },
    }),
    {
      isHovered: observable.ref,
      colIdx: observable.ref,
      rowIdx: observable.ref,
      row: computed,
      column: computed,
      position: computed,
      cell: computed,
      hasFocusedElementInRow: computed,
      focusedElementPosition: computed,
      isSelected: computed,
      editionState: computed,
      tableDataContext: observable.ref,
      selectionContext: observable.ref,
      props: observable.ref,
    },
    { colIdx, rowIdx, tableDataContext, selectionContext, props },
  );

  const isDatabaseActionApplied = getComputed(() =>
    [DatabaseEditChangeType.add, DatabaseEditChangeType.delete, DatabaseEditChangeType.update].includes(cellContext.editionState!),
  );

  const classes = getComputed(() =>
    clsx({
      'rdg-cell-custom-highlighted-row': cellContext.hasFocusedElementInRow && !isDatabaseActionApplied,
      'rdg-cell-custom-selected': cellContext.isSelected,
      'rdg-cell-custom-added': cellContext.editionState === DatabaseEditChangeType.add,
      'rdg-cell-custom-deleted': cellContext.editionState === DatabaseEditChangeType.delete,
      'rdg-cell-custom-edited': cellContext.editionState === DatabaseEditChangeType.update,
    }),
  );

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
            colIdx: this.colIdx,
            rowIdx: this.rowIdx,
          },
          event.ctrlKey || event.metaKey,
          event.shiftKey,
          false,
        );
      },
    }),
    {
      colIdx,
      rowIdx,
      selectionContext,
      dataGridContext,
    },
    ['mouseUp', 'mouseDown'],
  );

  return (
    <CellContext.Provider value={cellContext}>
      {renderDefaultCell({
        className: classes,
        'data-row-index': rowIdx,
        'data-column-index': colIdx,
        onMouseDown: state.mouseDown,
        onMouseUp: state.mouseUp,
        onMouseEnter: () => (cellContext.isHovered = true),
        onMouseLeave: () => (cellContext.isHovered = false),
      })}
    </CellContext.Provider>
  );
});
