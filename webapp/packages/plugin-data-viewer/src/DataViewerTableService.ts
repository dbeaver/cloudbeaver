/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionExecutionContextService, Connection, createConnectionParam } from '@cloudbeaver/core-connections';
import { App, injectable } from '@cloudbeaver/core-di';
import { EObjectFeature, NavNode, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource, IDataContainerOptions } from './ContainerDataSource';
import { DatabaseDataModel } from './DatabaseDataModel/DatabaseDataModel';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataSource';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';
import { DataViewerService } from './DataViewerService';
import { DataViewerSettingsService } from './DataViewerSettingsService';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

@injectable()
export class DataViewerTableService {
  constructor(
    private readonly app: App,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly tableViewerStorageService: TableViewerStorageService,
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly dataViewerService: DataViewerService,
    private readonly dataViewerSettingsService: DataViewerSettingsService,
  ) { }

  has(tableId: string): boolean {
    return this.tableViewerStorageService.has(tableId);
  }

  get(modelId: string): IDatabaseDataModel<any, any> | undefined {
    return this.tableViewerStorageService.get(modelId);
  }

  async removeTableModel(tableId: string): Promise<void> {
    const model = this.tableViewerStorageService.get(tableId);

    if (model) {
      this.tableViewerStorageService.remove(tableId);
      await model.dispose();
    }
  }

  create(
    connection: Connection,
    node: NavNode | undefined
  ): IDatabaseDataModel<IDataContainerOptions, IDatabaseResultSet> {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(node?.id ?? '');

    const source = new ContainerDataSource(
      this.app.getServiceInjector(),
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
    const dataModel = this.tableViewerStorageService.add(new DatabaseDataModel(source))
      .setCountGain(this.dataViewerSettingsService.getDefaultRowsCount())
      .setSlice(0)
      .setAccess(editable ? DatabaseDataAccessMode.Default : DatabaseDataAccessMode.Readonly);

    return dataModel;
  }
}
