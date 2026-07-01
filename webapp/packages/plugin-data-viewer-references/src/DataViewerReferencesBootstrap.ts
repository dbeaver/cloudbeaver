/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService, DataPresentationType, IDatabaseDataResultAction, isResultSetDataSource } from '@cloudbeaver/plugin-data-viewer';

import { DataViewerReferencesSettingsService } from './DataViewerReferencesSettingsService.js';

const DataViewerReferencesPresentation = importLazyComponent(() =>
  import('./DataViewerReferencesPresentation.js').then(module => module.DataViewerReferencesPresentation),
);

@injectable(() => [DataPresentationService, DataViewerReferencesSettingsService])
export class DataViewerReferencesBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataViewerReferencesSettingsService: DataViewerReferencesSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.dataPresentationService.add({
      id: 'references-presentation',
      type: DataPresentationType.toolsPanel,
      title: 'plugin_data_viewer_references',
      icon: '/icons/plugin_data_viewer_references_panel_m.svg',
      dataFormat: ResultDataFormat.Resultset,
      hidden: (dataFormat, model, resultIndex) => {
        const source = model.source;
        if (!isResultSetDataSource(source) || !source.hasResult(resultIndex) || this.dataViewerReferencesSettingsService.disabled) {
          return true;
        }

        const data = source.tryGetAction(resultIndex, IDatabaseDataResultAction);
        return data?.empty ?? true;
      },
      getPresentationComponent: () => DataViewerReferencesPresentation,
    });
  }
}
