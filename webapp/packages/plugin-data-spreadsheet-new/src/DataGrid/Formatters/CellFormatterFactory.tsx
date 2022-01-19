/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';
import type { FormatterProps } from 'react-data-grid';

import { IResultSetRowKey, isBooleanValuePresentationAvailable } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../CellRenderer/CellContext';
import { TableDataContext } from '../TableDataContext';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter';
import { TextFormatter } from './CellFormatters/TextFormatter';

interface IProps extends FormatterProps<IResultSetRowKey> {
  isEditing: boolean;
}

export const CellFormatterFactory = observer<IProps>(function CellFormatterFactory(props) {
  const formatterRef = useRef<React.FC<FormatterProps<IResultSetRowKey>> | null>(null);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);

  if (!props.isEditing || formatterRef.current === null) {
    formatterRef.current = TextFormatter;

    if (cellContext.cell) {
      const resultColumn = tableDataContext.getColumnInfo(cellContext.cell.column);
      const value = tableDataContext.getCellValue(cellContext.cell);

      if (value !== undefined) {
        const rawValue = tableDataContext.format.get(value);

        if (resultColumn && isBooleanValuePresentationAvailable(rawValue, resultColumn)) {
          formatterRef.current = BooleanFormatter;
        }
      }
    }
  }

  const Formatter = formatterRef.current!;

  return <Formatter {...props} />;
});
