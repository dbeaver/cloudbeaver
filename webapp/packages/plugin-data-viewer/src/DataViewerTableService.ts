/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource } from './ContainerDataSource';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataSource';
import type { DataModelWrapper } from './TableViewer/DataModelWrapper';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

@injectable()
export class DataViewerTableService {
  constructor(private tableViewerStorageService: TableViewerStorageService,
    private connectionInfoResource: ConnectionInfoResource,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService) {
  }

  has(tableId: string): boolean {
    return this.tableViewerStorageService.has(tableId);
  }

  get(modelId: string): DataModelWrapper | undefined {
    return this.tableViewerStorageService.get(modelId);
  }

  async removeTableModel(tableId: string): Promise<void> {
    const model = this.tableViewerStorageService.get(tableId);
    if (model) {
      await model.dispose();
    }
    this.tableViewerStorageService.remove(tableId);
  }

  async create(
    connectionId: string,
    containerNodePath = ''
  ): Promise<DataModelWrapper> {
    const connectionInfo = await this.connectionInfoResource.load(connectionId);
    const source = new ContainerDataSource(this.graphQLService, this.notificationService);

    const dataModel = this.tableViewerStorageService.create(
      source
        .setOptions({
          connectionId,
          containerNodePath,
          constraints: [],
          whereFilter: '',
        })
        .setSupportedDataFormats(connectionInfo.supportedDataFormats)
    )
      .setCountGain()
      .setSlice(0)
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    return dataModel;
  }
}
