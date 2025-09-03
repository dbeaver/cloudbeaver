import type { CellRendererProps } from 'react-data-grid';
import { BaseCell } from '../BaseCell.js';

export function cellRenderer<TRow, TSummaryRow>(key: React.Key, props: CellRendererProps<TRow, TSummaryRow>) {
  return <BaseCell key={key} {...props} />;
}
