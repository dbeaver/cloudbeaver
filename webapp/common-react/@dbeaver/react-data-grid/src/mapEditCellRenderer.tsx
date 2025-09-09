import type { RenderEditCellProps } from 'react-data-grid';
import type { IInnerRow } from './IInnerRow.js';
import { TextEditor } from './editors/TextEditor.js';

export function mapEditCellRenderer(colIdx: number) {
  return function RenderEditCell({ rowIdx, onClose }: RenderEditCellProps<IInnerRow, unknown>) {
    return <TextEditor rowIdx={rowIdx} colIdx={colIdx} onClose={() => onClose()} />;
  };
}
