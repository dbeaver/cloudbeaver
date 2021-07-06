/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import type { FormatterProps } from 'react-data-grid';

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter';
import { TextFormatter } from './CellFormatters/TextFormatter';

export const CellFormatterFactory: React.FC<FormatterProps> = function CellFormatterFactory(props) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const resultColumn = tableDataContext?.getColumnInfo(props.column.key);
  const rawValue = formatter?.get(props.row[props.column.key]) ?? props.row[props.column.key];

  let Formatter: React.FC<FormatterProps> = TextFormatter;

  if (resultColumn?.dataKind?.toLowerCase() === 'boolean' && (typeof rawValue === 'boolean' || formatter?.isNull(rawValue))) {
    Formatter = BooleanFormatter;
  }

  return <Formatter {...props} />;
};
