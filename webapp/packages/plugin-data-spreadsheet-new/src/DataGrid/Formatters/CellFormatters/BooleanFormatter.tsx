/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled, { use, css } from 'reshadow';

import type { IResultSetElementKey, IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../../Editing/EditingContext';
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

export const BooleanFormatter: React.FC<FormatterProps<IResultSetRowKey>> = observer(function BooleanFormatter({ column, row }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const editingContext = useContext(EditingContext);

  if (!context || !tableDataContext || !editingContext || column.columnDataIndex === null) {
    throw new Error('Contexts required');
  }
  const cellKey: IResultSetElementKey = { row, column: column.columnDataIndex };

  const formatter = tableDataContext.format;
  const rawValue = formatter.get(tableDataContext.getCellValue(cellKey)!);
  const value = typeof rawValue === 'string' ? rawValue.toLowerCase() === 'true' : rawValue;
  const stringifiedValue = formatter.toDisplayString(value);
  const valueRepresentation = value === null ? stringifiedValue : `[${value ? 'v' : ' '}]`;
  const disabled = (
    !column.editable
    || !!editingContext.readonly
    || formatter.isReadOnly(cellKey)
  );

  function toggleValue() {
    if (disabled || !tableDataContext) {
      return;
    }
    const resultColumn = tableDataContext.getColumnInfo(cellKey.column);

    if (!resultColumn) {
      return;
    }

    const nextValue = !resultColumn.required && value === false ? null : !value;

    tableDataContext.editor.set(cellKey, nextValue);
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
