import { Row, type RenderRowProps } from 'react-data-grid';
import { DataGridRowContext } from './DataGridRowContext.js';
import { memo, use, useEffect } from 'react';
import { useGridReactiveValue } from './useGridReactiveValue.js';

export const BaseRow = memo(function BaseRow<TRow, TSummaryRow>(props: RenderRowProps<TRow, TSummaryRow>) {
  const rowContext = use(DataGridRowContext);
  const rowsCount = useGridReactiveValue(rowContext?.onScrollToBottom ? rowContext?.rowCount : undefined);

  useEffect(() => {
    if (rowsCount === props.rowIdx + 1) {
      rowContext?.onScrollToBottom?.();
    }
  }, [rowsCount]);
  return <Row {...props} />;
}) as <TRow, TSummaryRow>(props: RenderRowProps<TRow, TSummaryRow>) => React.ReactNode;
