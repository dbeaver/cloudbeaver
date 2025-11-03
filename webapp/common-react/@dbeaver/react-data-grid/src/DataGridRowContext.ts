/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { IGridReactiveValue } from './IGridReactiveValue.js';

export interface IDataGridRowProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export interface IDataGridRowRenderer {
  (propsOverride: Partial<IDataGridRowProps>): React.ReactNode;
}

export interface IDataGridRowContext {
  rowElement?: IGridReactiveValue<React.ReactNode, [rowIdx: number, props: IDataGridRowProps, renderDefaultRow: IDataGridRowRenderer]>;
  rowCount: IGridReactiveValue<number, []>;
  onScrollToBottom?: () => void;
}

export const DataGridRowContext = createContext<IDataGridRowContext | null>(null);
