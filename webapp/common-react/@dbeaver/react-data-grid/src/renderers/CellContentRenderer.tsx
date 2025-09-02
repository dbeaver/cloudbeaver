import { use } from 'react';
import { DataGridCellContext } from '../DataGridCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';

export interface Props {
  rowIdx: number;
  colIdx: number;
}

export function CellContentRenderer({ rowIdx, colIdx }: Props) {
  const cellContext = use(DataGridCellContext);
  return useGridReactiveValue(cellContext?.cell, rowIdx, colIdx);
}
