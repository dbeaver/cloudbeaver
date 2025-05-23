import { createContext } from 'react';
import type { IGridReactiveValue } from './IGridReactiveValue.js';

export interface IDataGridHeaderCellContext {
  headerElement?: IGridReactiveValue<React.ReactNode, [colIdx: number]>;
  headerText?: IGridReactiveValue<string, [colIdx: number]>;
  getHeaderOrder?: () => number[];
  getHeaderWidth?: (colIdx: number) => number | string | null;
  getHeaderResizable?: (colIdx: number) => boolean;
  getHeaderHeight?: () => number;
  getHeaderPinned?: (colIdx: number) => boolean;
  getHeaderDnD?: (colIdx: number) => boolean;
  onHeaderReorder?: (from: number, to: number) => void;
}

export const DataGridCellHeaderContext = createContext<IDataGridHeaderCellContext | null>(null);
