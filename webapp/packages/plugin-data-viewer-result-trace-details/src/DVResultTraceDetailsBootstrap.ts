/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService, DataPresentationType } from '@cloudbeaver/plugin-data-viewer';

const DVResultTraceDetailsPresentation = importLazyComponent(() =>
  import('./DVResultTraceDetailsPresentation.js').then(module => module.DVResultTraceDetailsPresentation),
);

@injectable()
export class DVResultTraceDetailsBootstrap extends Bootstrap {
  constructor(private readonly dataPresentationService: DataPresentationService) {
    super();
  }

  override register() {
    this.dataPresentationService.add({
      id: 'result-trace-details-presentation',
      type: DataPresentationType.toolsPanel,
      dataFormat: ResultDataFormat.Resultset,
      icon: '/icons/result_details_sm.svg',
      title: 'plugin_data_viewer_result_trace_details',
      hidden(dataFormat, model, resultIndex) {
        const result = model.source.getResult(resultIndex);
        return !result?.data?.hasDynamicTrace;
      },
      getPresentationComponent: () => DVResultTraceDetailsPresentation,
    });
  }
}
