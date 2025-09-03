import { createContext } from 'react';

export interface IDataGridCellInnerContext {
  isFocused: boolean;
}

export const DataGridCellInnerContext = createContext<IDataGridCellInnerContext | null>(null);
