/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';
import type { FormatterProps } from 'react-data-grid';

import { ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter';
import { isBooleanFormatterAvailable } from './CellFormatters/isBooleanFormatterAvailable';
import { TextFormatter } from './CellFormatters/TextFormatter';

interface IProps extends FormatterProps {
  isEditing: boolean;
}

export const CellFormatterFactory: React.FC<IProps> = observer(function CellFormatterFactory(props) {
  const formatterRef = useRef<React.FC<FormatterProps> | null>(null);
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);

  if (!props.isEditing || formatterRef === null) {
    formatterRef.current = TextFormatter;

    if (tableDataContext && context) {
      const resultColumn = tableDataContext.getColumnInfo(props.column.key);
      const formatter = context.model.source.getAction(context.resultIndex, ResultSetFormatAction);
      const rawValue = formatter.get(props.row[props.column.key]);

      if (resultColumn && isBooleanFormatterAvailable(rawValue, resultColumn)) {
        formatterRef.current = BooleanFormatter;
      }
    }
  }

  const Formatter = formatterRef.current!;

  return <Formatter {...props} />;
});
