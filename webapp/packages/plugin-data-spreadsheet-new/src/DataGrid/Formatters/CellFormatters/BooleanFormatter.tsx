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

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

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

export const BooleanFormatter: React.FC<FormatterProps> = observer(function BooleanFormatter({ column, row, rowIdx }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const editingContext = useContext(EditingContext);

  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const resultColumn = tableDataContext?.getColumnInfo(column.key);
  const rawValue = formatter?.get(row[column.key]) ?? row[column.key];
  const value = typeof rawValue === 'string' ? rawValue.toLowerCase() === 'true' : rawValue;
  const stringifiedValue = formatter?.toDisplayString(value) ?? String(value);
  const valueRepresentation = value === null ? stringifiedValue : `[${value ? 'v' : ' '}]`;
  const disabled = !column.editable || !!editingContext?.readonly;

  const toggleValue = useCallback(() => {
    if (disabled) {
      return;
    }

    const newValue = !resultColumn?.required && value === false ? null : !value;

    context?.model.source.getEditor(context.resultIndex).setCell(rowIdx, Number(column.key), newValue);
  }, [context, resultColumn, column.key, rowIdx, value, disabled]);

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
