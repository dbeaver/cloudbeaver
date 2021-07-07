/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useRef } from 'react';
import type { FormatterProps } from 'react-data-grid';

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { DataGridContext } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter';
import { isBooleanFormatterAvailable } from './CellFormatters/isBooleanFormatterAvailable';
import { TextFormatter } from './CellFormatters/TextFormatter';

export const CellFormatterFactory: React.FC<FormatterProps> = function CellFormatterFactory(props) {
  const formatterRef = useRef<React.FC<FormatterProps> | null>(null);
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const formatter = context?.model.source.getAction(context.resultIndex, ResultSetFormatAction);
  const editingContext = useContext(EditingContext);
  const isEditing = editingContext?.isEditing({ idx: props.column.idx, rowIdx: props.rowIdx });

  const resultColumn = tableDataContext?.getColumnInfo(props.column.key);
  const rawValue = formatter?.get(props.row[props.column.key]) ?? props.row[props.column.key];

  if (!isEditing || formatterRef === null) {
    formatterRef.current = TextFormatter;

    if (resultColumn && isBooleanFormatterAvailable(rawValue, resultColumn)) {
      formatterRef.current = BooleanFormatter;
    }
  }

  const Formatter = formatterRef.current!;

  return <Formatter {...props} />;
};
