/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled, { use, css } from 'reshadow';

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

export const BooleanFormatter: React.FC<FormatterProps> = observer(function BooleanFormatter({ column, rowIdx }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const editingContext = useContext(EditingContext);

  if (!context || !tableDataContext || !editingContext || column.columnDataIndex === null) {
    throw new Error('Contexts required');
  }

  const formatter = tableDataContext.format;
  const rawValue = formatter.get(tableDataContext.getCellValue(rowIdx, column.columnDataIndex)!);
  const value = typeof rawValue === 'string' ? rawValue.toLowerCase() === 'true' : rawValue;
  const stringifiedValue = formatter.toDisplayString(value);
  const valueRepresentation = value === null ? stringifiedValue : `[${value ? 'v' : ' '}]`;
  const disabled = (
    !column.editable
    || !!editingContext.readonly
    || formatter.isReadOnly({ row: rowIdx, column: column.columnDataIndex })
  );

  const toggleValue = useCallback(() => {
    if (disabled || column.columnDataIndex === null) {
      return;
    }
    const resultColumn = tableDataContext.getColumnInfo(column.columnDataIndex);

    if (!resultColumn) {
      return;
    }

    const nextValue = !resultColumn.required && value === false ? null : !value;

    tableDataContext.editor
      .setCell(rowIdx, column.columnDataIndex, nextValue);
  }, [tableDataContext, column, rowIdx, value, disabled]);

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
