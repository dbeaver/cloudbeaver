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

import { DataGridContext } from '../../DataGridContext';
import { TableDataContext } from '../../TableDataContext';

const styles = css`
  boolean-formatter {
    cursor: pointer;
  }
  boolean-formatter[|boolean] {
    font-family: monospace;
    white-space: pre;
    line-height: 1;
    vertical-align: text-top;
  }
`;

function getClasses(rawValue: any) {
  const classes = [];
  if (rawValue === null) {
    classes.push('cell-null');
  }
  return classes.join(' ');
}

export const BooleanFormatter: React.FC<FormatterProps> = observer(function BooleanFormatter({ column, row, rowIdx }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const resultColumn = tableDataContext?.getColumnInfo(column.key);
  const rawValue = formatter?.get(row[column.key]) ?? row[column.key];
  const value = typeof rawValue === 'string' ? rawValue.toLowerCase() === 'true' : rawValue;
  const stringifiedValue = formatter?.toDisplayString(value) ?? String(value);
  const valueRepresentation = value === null ? stringifiedValue : `[${value ? 'v' : ' '}]`;
  const classes = getClasses(rawValue);

  const getNextValue = useCallback((prev: boolean | null) => {
    if (!resultColumn?.required && prev === false) {
      return null;
    }

    return !prev;
  }, [resultColumn]);

  return styled(styles)(
    <boolean-formatter
      className={classes}
      as='span'
      title={stringifiedValue}
      onClick={() => context?.model.source.getEditor(context.resultIndex)
        .setCell(rowIdx, Number(column.key), getNextValue(value))}
      {...use({ boolean: value !== null })}
    >
      {valueRepresentation}
    </boolean-formatter>
  );
});
