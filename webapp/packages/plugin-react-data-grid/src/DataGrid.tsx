/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ForwardedRef, forwardRef, Key, RefAttributes } from 'react';
import ReactDataGrid, { DataGridHandle, DataGridProps } from 'react-data-grid';

import './reset.css';

const DataGridInner: <R, SR = unknown, K extends Key = Key>(props: DataGridProps<R, SR, K>, ref: ForwardedRef<DataGridHandle>) => JSX.Element =
  function DataGrid(props, ref) {
    return <ReactDataGrid {...props} ref={ref} className={['react-data-grid-container', props.className].join(' ')} />;
  };

export const DataGrid = forwardRef(DataGridInner) as <T>(props: DataGridProps<T> & RefAttributes<DataGridHandle>) => ReturnType<typeof DataGridInner>;
