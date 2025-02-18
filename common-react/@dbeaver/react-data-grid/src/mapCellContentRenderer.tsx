import type { RenderCellProps } from 'react-data-grid';
import type { IInnerRow } from './IInnerRow.js';
import { CellContentRenderer } from './renderers/CellContentRenderer.js';

export function mapCellContentRenderer({ rowIdx, column }: RenderCellProps<IInnerRow, unknown>) {
  return <CellContentRenderer rowIdx={rowIdx} colIdx={column.idx} />;
}
