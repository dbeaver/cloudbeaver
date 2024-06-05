/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Key, RefAttributes } from 'react';
import ReactDataGrid, { DataGridHandle, DataGridProps } from 'react-data-grid';

import './reset.css';

export const DataGrid: <R, SR = unknown, K extends Key = Key>(props: DataGridProps<R, SR, K> & RefAttributes<DataGridHandle>) => JSX.Element =
  function DataGrid(props) {
    return <ReactDataGrid {...props} className={['react-data-grid-container', props.className].join(' ')} />;
  };
