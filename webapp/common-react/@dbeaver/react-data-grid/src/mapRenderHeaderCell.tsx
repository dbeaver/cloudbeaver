import type { RenderHeaderCellProps } from 'react-data-grid';
import type { IInnerRow } from './IInnerRow.js';
import { HeaderCellContentRenderer } from './renderers/HeaderCellContentRenderer.js';

export function mapRenderHeaderCell(colIdx: number) {
  return function RenderHeaderCell({ tabIndex }: RenderHeaderCellProps<IInnerRow, unknown>) {
    return <HeaderCellContentRenderer colIdx={colIdx} tabIndex={tabIndex} />;
  };
}
