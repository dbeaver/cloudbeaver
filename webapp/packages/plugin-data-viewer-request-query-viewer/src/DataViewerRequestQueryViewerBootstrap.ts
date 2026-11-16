/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { DatabaseDataFeature, isResultSetDataSource, TableHeaderService } from '@cloudbeaver/plugin-data-viewer';

import { DataViewerRequestQueryViewerSettingsService } from './DataViewerRequestQueryViewerSettingsService.js';

export const DataViewerRequestQueryViewer = importLazyComponent(() =>
  import('./DataViewerRequestQueryViewer.js').then(m => m.DataViewerRequestQueryViewer),
);

export class DataViewerRequestQueryViewerBootstrapImpl extends Bootstrap {
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
      props =>
        !isResultSetDataSource(props.model.source) ||
        this.dataViewerRequestQueryViewerSettingsService.disabled ||
        props.model.source.hasFeature(DatabaseDataFeature.References),
    );
  }
}

export type DataViewerRequestQueryViewerBootstrap = DataViewerRequestQueryViewerBootstrapImpl;

export class DataViewerRequestQueryViewerBootstrapDI extends Context.Service<
  DataViewerRequestQueryViewerBootstrapDI,
  DataViewerRequestQueryViewerBootstrapImpl
>()('@cloudbeaver/plugin-data-viewer-request-query-viewer/DataViewerRequestQueryViewerBootstrap#DataViewerRequestQueryViewerBootstrap') {
  static readonly implementation = DataViewerRequestQueryViewerBootstrapImpl;

  static readonly dependencies = () => [TableHeaderService, DataViewerRequestQueryViewerSettingsService] as const;
  static readonly make: Effect.Effect<
    DataViewerRequestQueryViewerBootstrapImpl,
    never,
    Context.Service.Identifier<typeof TableHeaderService> | Context.Service.Identifier<typeof DataViewerRequestQueryViewerSettingsService>
  > = Effect.gen(function* makeDataViewerRequestQueryViewerBootstrap() {
    const tableHeaderService = yield* TableHeaderService;
    const dataViewerRequestQueryViewerSettingsService = yield* DataViewerRequestQueryViewerSettingsService;

    return new DataViewerRequestQueryViewerBootstrapImpl(tableHeaderService, dataViewerRequestQueryViewerSettingsService);
  });
  static readonly layer: Layer.Layer<
    DataViewerRequestQueryViewerBootstrapDI,
    never,
    Context.Service.Identifier<typeof TableHeaderService> | Context.Service.Identifier<typeof DataViewerRequestQueryViewerSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerRequestQueryViewerBootstrap = DataViewerRequestQueryViewerBootstrapDI;
