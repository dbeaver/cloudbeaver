/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataPresentationProps } from '@cloudbeaver/plugin-data-viewer';

import { DataGridTable } from './DataGrid/DataGridTableLoader.js';

export const SpreadsheetGrid: React.FC<IDataPresentationProps> = function SpreadsheetGrid(props) {
  return <DataGridTable {...props} />;
};
