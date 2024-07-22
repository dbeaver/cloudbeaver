/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import ReactDataGrid from '@cloudbeaver/plugin-react-data-grid';
import '@cloudbeaver/plugin-react-data-grid/react-data-grid-dist/lib/styles.css';

import classes from './DataGrid.module.css';

export const DataGrid = observer(
  forwardRef(function DataGrid(props, ref) {
    return <ReactDataGrid {...props} ref={ref} className={clsx(classes.dataGrid, props.className)} />;
  }),
) as typeof ReactDataGrid;
