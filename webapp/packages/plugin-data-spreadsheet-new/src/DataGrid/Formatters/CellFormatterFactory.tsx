/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';

import { isBooleanValuePresentationAvailable } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../CellRenderer/CellContext.js';
import { TableDataContext } from '../TableDataContext.js';
import { BlobFormatter } from './CellFormatters/BlobFormatter.js';
import { BooleanFormatter } from './CellFormatters/BooleanFormatter.js';
import { TextFormatter } from './CellFormatters/TextFormatter.js';
import type { ICellFormatterProps } from './ICellFormatterProps.js';
import { IndexFormatter } from './IndexFormatter.js';

export const CellFormatterFactory = observer<ICellFormatterProps>(function CellFormatterFactory(props) {
  const formatterRef = useRef<React.FC<ICellFormatterProps> | null>(null);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);

  if (formatterRef.current === null) {
    formatterRef.current = TextFormatter;

    if (cellContext.cell) {
      const isBlob = tableDataContext.format.isBinary(cellContext.cell);

      if (isBlob) {
        formatterRef.current = BlobFormatter;
      } else {
        const value = tableDataContext.getCellValue(cellContext.cell);
        if (value !== undefined) {
          const resultColumn = tableDataContext.getColumnInfo(cellContext.cell.column);
          const rawValue = tableDataContext.format.get(cellContext.cell);

          if (resultColumn && isBooleanValuePresentationAvailable(rawValue, resultColumn)) {
            formatterRef.current = BooleanFormatter;
          }
        }
      }
    } else {
      formatterRef.current = IndexFormatter;
    }
  }

  const Formatter = formatterRef.current!;

  return <Formatter {...props} />;
});
