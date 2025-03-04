import { createContext } from 'react';
import type { IGridReactiveValue } from './IGridReactiveValue.js';

export interface IDataGridRowContext {
  rowCount: IGridReactiveValue<number, []>;
  onScrollToBottom?: () => void;
}

export const DataGridRowContext = createContext<IDataGridRowContext | null>(null);
