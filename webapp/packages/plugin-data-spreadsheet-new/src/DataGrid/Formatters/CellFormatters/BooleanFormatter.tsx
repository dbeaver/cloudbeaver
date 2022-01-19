/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled, { use, css } from 'reshadow';

import type { IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../../Editing/EditingContext';
import { CellContext } from '../../CellRenderer/CellContext';
import { DataGridContext } from '../../DataGridContext';
import { TableDataContext } from '../../TableDataContext';

const styles = css`
  boolean-formatter {
    cursor: pointer;
  }
  boolean-formatter[|disabled] {
    cursor: auto;
  }
  boolean-formatter[|boolean] {
    font-family: monospace;
    white-space: pre;
    line-height: 1;
    vertical-align: text-top;
  }
`;

export const BooleanFormatter = observer<FormatterProps<IResultSetRowKey>>(function BooleanFormatter({ column, row }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const editingContext = useContext(EditingContext);
  const cellContext = useContext(CellContext);

  if (!context || !tableDataContext || !editingContext || !cellContext?.cell) {
    throw new Error('Contexts required');
  }

  const formatter = tableDataContext.format;
  const rawValue = useMemo(
    () => computed(() => formatter.get(tableDataContext.getCellValue(cellContext!.cell!)!)),
    [tableDataContext, cellContext.cell, formatter]
  ).get();
  const value = typeof rawValue === 'string' ? rawValue.toLowerCase() === 'true' : rawValue;
  const stringifiedValue = formatter.toDisplayString(value);
  const valueRepresentation = value === null ? stringifiedValue : `[${value ? 'v' : ' '}]`;
  const disabled = (
    !column.editable
    || editingContext.readonly
    || formatter.isReadOnly(cellContext.cell)
  );

  function toggleValue() {
    if (disabled || !tableDataContext || !cellContext?.cell) {
      return;
    }
    const resultColumn = tableDataContext.getColumnInfo(cellContext.cell.column);

    if (!resultColumn) {
      return;
    }

    const nextValue = !resultColumn.required && value === false ? null : !value;

    tableDataContext.editor.set(cellContext.cell, nextValue);
  }

  return styled(styles)(
    <boolean-formatter
      className={value === null ? 'cell-null' : undefined}
      as='span'
      title={stringifiedValue}
      onClick={toggleValue}
      {...use({ disabled, boolean: value !== null })}
    >
      {valueRepresentation}
    </boolean-formatter>
  );
});
