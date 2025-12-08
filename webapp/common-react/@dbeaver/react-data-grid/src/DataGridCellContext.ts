/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { IGridReactiveValue } from './IGridReactiveValue.js';

export interface IDataGridCellProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  isFocused: boolean;
}

export interface IDataGridCellRenderer {
  (propsOverride: Partial<IDataGridCellProps> & { [key: string]: any }): React.ReactNode;
}

export interface IDataGridCellContext {
  cellElement?: IGridReactiveValue<
    React.ReactNode,
    [rowIdx: number, colIdx: number, props: IDataGridCellProps, renderDefaultCell: IDataGridCellRenderer]
  >;
  cell?: IGridReactiveValue<React.ReactNode, [rowIdx: number, colIdx: number]>;
  cellText?: IGridReactiveValue<string, [rowIdx: number, colIdx: number]>;
  cellTooltip?: IGridReactiveValue<string, [rowIdx: number, colIdx: number]>;
  getCellEditable?: (rowIdx: number, colIdx: number) => boolean;
  onCellChange?: (rowIdx: number, colIdx: number, value: any) => void;
}

export const DataGridCellContext = createContext<IDataGridCellContext | null>(null);
