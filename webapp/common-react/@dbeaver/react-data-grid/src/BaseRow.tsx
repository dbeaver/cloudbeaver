/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Row, type RenderRowProps } from 'react-data-grid';
import { DataGridRowContext, type IDataGridRowRenderer } from './DataGridRowContext.js';
import { memo, use, useEffect, useMemo } from 'react';
import { useGridReactiveValue } from './useGridReactiveValue.js';

export const BaseRow = memo(function BaseRow<TRow, TSummaryRow>(props: RenderRowProps<TRow, TSummaryRow>) {
  const rowContext = use(DataGridRowContext);
  const rowsCount = useGridReactiveValue(rowContext?.onScrollToBottom ? rowContext?.rowCount : undefined);

  useEffect(() => {
    if (rowsCount === props.rowIdx + 1) {
      rowContext?.onScrollToBottom?.();
    }
  }, [rowsCount]);

  const renderDefaultRow = useMemo<IDataGridRowRenderer>(
    () => override => (
      <Row
        {...props}
        {...override}
      />
    ),
    [...Object.values(props)],
  );

  const rowElement = useGridReactiveValue(rowContext?.rowElement, props.rowIdx, props, renderDefaultRow);

  return rowElement ?? <Row {...props} />;
}) as <TRow, TSummaryRow>(props: RenderRowProps<TRow, TSummaryRow>) => React.ReactNode;
