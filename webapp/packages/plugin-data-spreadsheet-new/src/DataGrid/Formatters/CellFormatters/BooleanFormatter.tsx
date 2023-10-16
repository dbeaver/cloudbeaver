/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import type { IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';
import type { RenderCellProps } from '@cloudbeaver/plugin-react-data-grid';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellContext } from '../../CellRenderer/CellContext';
import { DataGridContext } from '../../DataGridContext';
import { TableDataContext } from '../../TableDataContext';
import style from './BooleanFormatter.m.css';

export const BooleanFormatter = observer<RenderCellProps<IResultSetRowKey>>(function BooleanFormatter({ column, row }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const editingContext = useContext(EditingContext);
  const cellContext = useContext(CellContext);

  const cell = cellContext.cell;

  if (!context || !tableDataContext || !editingContext || !cell) {
    throw new Error('Contexts required');
  }

  const styles = useS(style);

  const formatter = tableDataContext.format;
  const value = getComputed(() => formatter.get(cell));
  const textValue = getComputed(() => formatter.getText(cell));
  const booleanValue = getComputed(() => textValue.toLowerCase() === 'true');
  const stringifiedValue = getComputed(() => formatter.getDisplayString(cell));
  const valueRepresentation = value === null ? stringifiedValue : `[${booleanValue ? 'v' : ' '}]`;
  const disabled = !column.editable || editingContext.readonly || formatter.isReadOnly(cell);

  function toggleValue() {
    if (disabled || !tableDataContext || !cell) {
      return;
    }
    const resultColumn = tableDataContext.getColumnInfo(cell.column);

    if (!resultColumn) {
      return;
    }

    const nextValue = !resultColumn.required && value === false ? null : !booleanValue;

    tableDataContext.editor.set(cell, nextValue);
  }

  return (
    <span className={s(styles, { booleanFormatter: true, nullValue: value === null, disabled })} title={stringifiedValue} onClick={toggleValue}>
      {valueRepresentation}
    </span>
  );
});
