/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type Connection, ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import { EObjectFeature, type NavNode, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource } from './ContainerDataSource.js';
import { DatabaseDataModel } from './DatabaseDataModel/DatabaseDataModel.js';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import { DataViewerService } from './DataViewerService.js';
import { DataViewerSettingsService } from './DataViewerSettingsService.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';

export class DataViewerTableServiceImpl {
  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly tableViewerStorageService: TableViewerStorageService,
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly dataViewerService: DataViewerService,
    private readonly dataViewerSettingsService: DataViewerSettingsService,
  ) {}

  create(connection: Connection, node: NavNode | undefined): IDatabaseDataModel<ContainerDataSource> {
    const nodeInfo = this.navNodeManagerService.getNodeContainerInfo(node?.uri ?? '');

    const source = new ContainerDataSource(
      this.serviceProvider,
      this.graphQLService,
      this.asyncTaskInfoService,
      this.connectionExecutionContextService,
    );

    source
      .setOptions({
        connectionKey: createConnectionParam(connection),
        containerNodePath: node?.uri ?? '',
        schema: nodeInfo.schemaId,
        catalog: nodeInfo.catalogId,
        constraints: [],
        whereFilter: '',
      })
      .setSupportedDataFormats(connection.supportedDataFormats)
      .setConstraintsAvailable(node?.objectFeatures.includes(EObjectFeature.supportsDataFilter) ?? true);

    const dataModel = this.tableViewerStorageService
      .add(new DatabaseDataModel(source))
      .setCountGain(this.dataViewerSettingsService.getDefaultRowsCount())
      .setSlice(0);

    this.dataViewerService.trackDataAccess(dataModel);

    return dataModel;
  }
}

export type DataViewerTableService = DataViewerTableServiceImpl;

export class DataViewerTableServiceDI extends Context.Service<DataViewerTableServiceDI, DataViewerTableServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer/DataViewerTableService#DataViewerTableService',
) {
  static readonly implementation = DataViewerTableServiceImpl;

  static readonly dependencies = () =>
    [
      IServiceProvider,
      NavNodeManagerService,
      TableViewerStorageService,
      GraphQLService,
      AsyncTaskInfoService,
      ConnectionExecutionContextService,
      DataViewerService,
      DataViewerSettingsService,
    ] as const;
  static readonly make: Effect.Effect<
    DataViewerTableServiceImpl,
    never,
    | Context.Service.Identifier<typeof IServiceProvider>
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof TableViewerStorageService>
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
    | Context.Service.Identifier<typeof ConnectionExecutionContextService>
    | Context.Service.Identifier<typeof DataViewerService>
    | Context.Service.Identifier<typeof DataViewerSettingsService>
  > = Effect.gen(function* makeDataViewerTableService() {
    const serviceProvider = yield* IServiceProvider;
    const navNodeManagerService = yield* NavNodeManagerService;
    const tableViewerStorageService = yield* TableViewerStorageService;
    const graphQLService = yield* GraphQLService;
    const asyncTaskInfoService = yield* AsyncTaskInfoService;
    const connectionExecutionContextService = yield* ConnectionExecutionContextService;
    const dataViewerService = yield* DataViewerService;
    const dataViewerSettingsService = yield* DataViewerSettingsService;

    return new DataViewerTableServiceImpl(
      serviceProvider,
      navNodeManagerService,
      tableViewerStorageService,
      graphQLService,
      asyncTaskInfoService,
      connectionExecutionContextService,
      dataViewerService,
      dataViewerSettingsService,
    );
  });
  static readonly layer: Layer.Layer<
    DataViewerTableServiceDI,
    never,
    | Context.Service.Identifier<typeof IServiceProvider>
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof TableViewerStorageService>
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
    | Context.Service.Identifier<typeof ConnectionExecutionContextService>
    | Context.Service.Identifier<typeof DataViewerService>
    | Context.Service.Identifier<typeof DataViewerSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerTableService = DataViewerTableServiceDI;
