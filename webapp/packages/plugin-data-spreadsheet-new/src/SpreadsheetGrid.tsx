/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataPresentationProps } from '@cloudbeaver/plugin-data-viewer';

import { DataGridTable } from './DataGrid/DataGridTableLoader.js';
import { useDataGridSearch } from './DataGrid/useDataGridSearch.js';
import { DataGridSearchStateContext } from './DataGrid/DataGridSearchProvider.js';

export const SpreadsheetGrid: React.FC<IDataPresentationProps> = function SpreadsheetGrid({ model, resultIndex, ...rest }) {
  const searchState = useDataGridSearch(model.id, resultIndex);

  return (
    <DataGridSearchStateContext value={searchState}>
      <DataGridTable {...rest} model={model} resultIndex={resultIndex} />
    </DataGridSearchStateContext>
  );
};
