import type { RenderEditCellProps } from 'react-data-grid';
import type { IInnerRow } from './IInnerRow.js';
import { TextEditor } from './editors/TextEditor.js';

export function mapEditCellRenderer({ rowIdx, column, onClose }: RenderEditCellProps<IInnerRow, unknown>) {
  return <TextEditor rowIdx={rowIdx} colIdx={column.idx} onClose={() => onClose()} />;
}
