import { createContext } from 'react';

export interface IDataGridHeaderCellContext {
  getHeaderElement?: (colIdx: number) => React.ReactNode;
  getHeaderText?: (colIdx: number) => string;
  getHeaderTooltip?: (colIdx: number) => string;
  getHeaderWidth?: (colIdx: number) => number | 'auto' | null;
  getHeaderResizable?: (colIdx: number) => boolean;
  getHeaderHeight?: () => number;
  getHeaderPinned?: (colIdx: number) => boolean;
}

export const DataGridCellHeaderContext = createContext<IDataGridHeaderCellContext | null>(null);
