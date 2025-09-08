import type { RenderRowProps } from 'react-data-grid';
import { BaseRow } from '../BaseRow.js';

export function rowRenderer<TRow, TSummaryRow>(key: React.Key, props: RenderRowProps<TRow, TSummaryRow>) {
  return <BaseRow key={key} {...props} />;
}
