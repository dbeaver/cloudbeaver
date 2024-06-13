/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef } from 'react';
import ReactDataGrid from 'react-data-grid';

import './reset.css';

export const DataGrid = forwardRef(function DataGrid(props, ref) {
  return <ReactDataGrid {...props} ref={ref} className={['react-data-grid-container', props.className].join(' ')} />;
}) as typeof ReactDataGrid;
