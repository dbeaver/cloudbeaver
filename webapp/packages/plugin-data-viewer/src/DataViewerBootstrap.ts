/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { DataViewerTabService } from './DataViewerTabService.js';
import { ResultSetTableFooterMenuService } from './ResultSet/ResultSetTableFooterMenuService.js';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService.js';

export class DataViewerBootstrapImpl extends Bootstrap {
  constructor(
    private readonly dataViewerTabService: DataViewerTabService,
    private readonly tableFooterMenuService: TableFooterMenuService,
    private readonly resultSetTableFooterMenuService: ResultSetTableFooterMenuService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.dataViewerTabService.registerTabHandler();
    this.dataViewerTabService.register();
    this.tableFooterMenuService.register();
    this.resultSetTableFooterMenuService.register();
  }
}

export type DataViewerBootstrap = DataViewerBootstrapImpl;

export class DataViewerBootstrapDI extends Context.Service<DataViewerBootstrapDI, DataViewerBootstrapImpl>()(
  '@cloudbeaver/plugin-data-viewer/DataViewerBootstrap#DataViewerBootstrap',
) {
  static readonly implementation = DataViewerBootstrapImpl;

  static readonly dependencies = () => [DataViewerTabService, TableFooterMenuService, ResultSetTableFooterMenuService] as const;
  static readonly make: Effect.Effect<
    DataViewerBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof DataViewerTabService>
    | Context.Service.Identifier<typeof TableFooterMenuService>
    | Context.Service.Identifier<typeof ResultSetTableFooterMenuService>
  > = Effect.gen(function* makeDataViewerBootstrap() {
    const dataViewerTabService = yield* DataViewerTabService;
    const tableFooterMenuService = yield* TableFooterMenuService;
    const resultSetTableFooterMenuService = yield* ResultSetTableFooterMenuService;

    return new DataViewerBootstrapImpl(dataViewerTabService, tableFooterMenuService, resultSetTableFooterMenuService);
  });
  static readonly layer: Layer.Layer<
    DataViewerBootstrapDI,
    never,
    | Context.Service.Identifier<typeof DataViewerTabService>
    | Context.Service.Identifier<typeof TableFooterMenuService>
    | Context.Service.Identifier<typeof ResultSetTableFooterMenuService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerBootstrap = DataViewerBootstrapDI;
