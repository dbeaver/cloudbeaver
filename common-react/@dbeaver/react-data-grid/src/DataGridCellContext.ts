import { createContext } from 'react';

export interface IDataGridCellProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  isFocused: boolean;
}

export interface IDataGridCellRenderer {
  (propsOverride: Partial<IDataGridCellProps> & { [key: string]: any }): React.ReactNode;
}

export interface IDataGridCellContext {
  getCellElement?: (rowIdx: number, colIdx: number, props: IDataGridCellProps, renderDefaultCell: IDataGridCellRenderer) => React.ReactNode;
  getCell: (rowIdx: number, colIdx: number) => React.ReactNode;
  getCellText?: (rowIdx: number, colIdx: number) => string;
  getCellTooltip?: (rowIdx: number, colIdx: number) => string;
  getCellEditable?: (rowIdx: number, colIdx: number) => boolean;
  onCellChange?: (rowIdx: number, colIdx: number, value: any) => void;
}

export const DataGridCellContext = createContext<IDataGridCellContext | null>(null);
