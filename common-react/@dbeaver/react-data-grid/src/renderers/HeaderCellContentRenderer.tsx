import { use } from 'react';
import { DataGridCellHeaderContext } from '../DataGridHeaderCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';

interface Props {
  colIdx: number;
}
export function HeaderCellContentRenderer({ colIdx }: Props) {
  const cellHeaderContext = use(DataGridCellHeaderContext);
  const headerElement = useGridReactiveValue(cellHeaderContext?.headerElement, colIdx);
  const getHeaderText = useGridReactiveValue(headerElement ? undefined : cellHeaderContext?.headerText, colIdx);
  return headerElement ?? getHeaderText ?? '';
}
