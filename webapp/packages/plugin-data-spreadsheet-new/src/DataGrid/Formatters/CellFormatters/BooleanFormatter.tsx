/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, useS } from '@cloudbeaver/core-blocks';
import type { RenderCellProps } from '@cloudbeaver/plugin-data-grid';
import { DatabaseEditChangeType, type IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../../Editing/EditingContext.js';
import { CellContext } from '../../CellRenderer/CellContext.js';
import { DataGridContext } from '../../DataGridContext.js';
import { TableDataContext } from '../../TableDataContext.js';
import style from './BooleanFormatter.module.css';

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
  const disabled =
    !column.editable ||
    editingContext.readonly ||
    formatter.isReadOnly(cell) ||
    (!context.model.hasElementIdentifier(context.resultIndex) && cellContext.editionState !== DatabaseEditChangeType.add);

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
