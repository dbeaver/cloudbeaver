/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { clsx } from '@dbeaver/ui-kit';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { DataGrid as BaseDataGrid } from '@dbeaver/react-data-grid';

import classes from './DataGrid.module.css';
import { useGridErrorFilter } from './useGridErrorFilter.js';

export const DataGrid = observer(
  forwardRef(function DataGrid(props, ref) {
    useGridErrorFilter();

    return <BaseDataGrid {...props} ref={ref} className={clsx(classes['dataGrid'], props.className)} />;
  }),
) as typeof BaseDataGrid;
