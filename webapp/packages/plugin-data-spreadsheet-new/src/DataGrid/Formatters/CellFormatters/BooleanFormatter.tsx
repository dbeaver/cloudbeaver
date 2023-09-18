/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';

import { s, useS } from '@cloudbeaver/core-blocks';
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

  if (!context || !tableDataContext || !editingContext || !cellContext.cell) {
    throw new Error('Contexts required');
  }

  const styles = useS(style);

  const formatter = tableDataContext.format;
  const rawValue = useMemo(
    () => computed(() => formatter.get(tableDataContext.getCellValue(cellContext!.cell!)!)),
    [tableDataContext, cellContext.cell, formatter],
  ).get();
  const value = typeof rawValue === 'string' ? rawValue.toLowerCase() === 'true' : rawValue;
  const stringifiedValue = formatter.toDisplayString(value);
  const valueRepresentation = value === null ? stringifiedValue : `[${value ? 'v' : ' '}]`;
  const disabled = !column.editable || editingContext.readonly || formatter.isReadOnly(cellContext.cell);

  function toggleValue() {
    if (disabled || !tableDataContext || !cellContext.cell) {
      return;
    }
    const resultColumn = tableDataContext.getColumnInfo(cellContext.cell.column);

    if (!resultColumn) {
      return;
    }

    const nextValue = !resultColumn.required && value === false ? null : !value;

    tableDataContext.editor.set(cellContext.cell, nextValue);
  }

  return (
    <span className={s(styles, { booleanFormatter: true, nullValue: value === null, disabled })} title={stringifiedValue} onClick={toggleValue}>
      {valueRepresentation}
    </span>
  );
});
