/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type Connection, ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { EObjectFeature, type NavNode, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource } from './ContainerDataSource.js';
import { DatabaseDataModel } from './DatabaseDataModel/DatabaseDataModel.js';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataSource.js';
import { DataViewerService } from './DataViewerService.js';
import { DataViewerSettingsService } from './DataViewerSettingsService.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';

@injectable()
export class DataViewerTableService {
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
    const nodeInfo = this.navNodeManagerService.getNodeContainerInfo(node?.id ?? '');

    const source = new ContainerDataSource(
      this.serviceProvider,
      this.graphQLService,
      this.asyncTaskInfoService,
      this.connectionExecutionContextService,
    );

    source
      .setOptions({
        connectionKey: createConnectionParam(connection),
        containerNodePath: node?.id ?? '',
        schema: nodeInfo.schemaId,
        catalog: nodeInfo.catalogId,
        constraints: [],
        whereFilter: '',
      })
      .setSupportedDataFormats(connection.supportedDataFormats)
      .setConstraintsAvailable(node?.objectFeatures.includes(EObjectFeature.supportsDataFilter) ?? true);

    const editable = this.dataViewerService.isDataEditable(connection);
    const dataModel = this.tableViewerStorageService
      .add(new DatabaseDataModel(source))
      .setCountGain(this.dataViewerSettingsService.getDefaultRowsCount())
      .setSlice(0)
      .setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly);

    return dataModel;
  }
}
