/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService, DataPresentationType, isResultSetDataSource, ResultSetDataSource } from '@cloudbeaver/plugin-data-viewer';

const DVResultTraceDetailsPresentation = importLazyComponent(() =>
  import('./DVResultTraceDetailsPresentation.js').then(module => module.DVResultTraceDetailsPresentation),
);

export class DVResultTraceDetailsBootstrapImpl extends Bootstrap {
  constructor(private readonly dataPresentationService: DataPresentationService) {
    super();
  }

  override register(): void {
    this.dataPresentationService.add({
      id: 'result-trace-details-presentation',
      type: DataPresentationType.toolsPanel,
      dataFormat: ResultDataFormat.Resultset,
      icon: '/icons/result_details_sm.svg',
      title: 'plugin_data_viewer_result_trace_details',
      hidden(dataFormat, model, resultIndex) {
        const source = model.source;

        if (!isResultSetDataSource(source)) {
          return true;
        }

        const result = (source as ResultSetDataSource).getResult(resultIndex);

        return !result?.data?.hasDynamicTrace;
      },
      getPresentationComponent: () => DVResultTraceDetailsPresentation,
    });
  }
}

export type DVResultTraceDetailsBootstrap = DVResultTraceDetailsBootstrapImpl;

export class DVResultTraceDetailsBootstrapDI extends Context.Service<DVResultTraceDetailsBootstrapDI, DVResultTraceDetailsBootstrapImpl>()(
  '@cloudbeaver/plugin-data-viewer-result-trace-details/DVResultTraceDetailsBootstrap#DVResultTraceDetailsBootstrap',
) {
  static readonly implementation = DVResultTraceDetailsBootstrapImpl;

  static readonly dependencies = () => [DataPresentationService] as const;
  static readonly make: Effect.Effect<DVResultTraceDetailsBootstrapImpl, never, Context.Service.Identifier<typeof DataPresentationService>> =
    Effect.gen(function* makeDVResultTraceDetailsBootstrap() {
      const dataPresentationService = yield* DataPresentationService;

      return new DVResultTraceDetailsBootstrapImpl(dataPresentationService);
    });
  static readonly layer: Layer.Layer<DVResultTraceDetailsBootstrapDI, never, Context.Service.Identifier<typeof DataPresentationService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const DVResultTraceDetailsBootstrap = DVResultTraceDetailsBootstrapDI;
