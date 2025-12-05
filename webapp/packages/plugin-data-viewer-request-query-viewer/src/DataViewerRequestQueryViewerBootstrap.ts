/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { isResultSetDataSource, TableHeaderService } from '@cloudbeaver/plugin-data-viewer';

import { DataViewerRequestQueryViewerSettingsService } from './DataViewerRequestQueryViewerSettingsService.js';

export const DataViewerRequestQueryViewer = importLazyComponent(() =>
  import('./DataViewerRequestQueryViewer.js').then(m => m.DataViewerRequestQueryViewer),
);

@injectable(() => [TableHeaderService, DataViewerRequestQueryViewerSettingsService])
export class DataViewerRequestQueryViewerBootstrap extends Bootstrap {
  constructor(
    private readonly tableHeaderService: TableHeaderService,
    private readonly dataViewerRequestQueryViewerSettingsService: DataViewerRequestQueryViewerSettingsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.tableHeaderService.tableHeaderPlaceholder.add(
      DataViewerRequestQueryViewer,
      Number.MIN_SAFE_INTEGER,
      props => !isResultSetDataSource(props.model.source) || this.dataViewerRequestQueryViewerSettingsService.disabled,
    );
  }
}
