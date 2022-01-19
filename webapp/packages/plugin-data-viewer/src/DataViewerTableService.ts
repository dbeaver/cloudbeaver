/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionExecutionContextService, Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource, IDataContainerOptions } from './ContainerDataSource';
import { DatabaseDataModel } from './DatabaseDataModel/DatabaseDataModel';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataSource';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';
import { getDefaultRowsCount } from './getDefaultRowsCount';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

@injectable()
export class DataViewerTableService {
  constructor(
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private asyncTaskInfoService: AsyncTaskInfoService,
    private connectionExecutionContextService: ConnectionExecutionContextService,
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
    containerNodePath = ''
  ): IDatabaseDataModel<IDataContainerOptions, IDatabaseResultSet> {
    const source = new ContainerDataSource(
      this.graphQLService,
      this.notificationService,
      this.asyncTaskInfoService,
      this.connectionExecutionContextService
    );

    source
      .setOptions({
        connectionId: connection.id,
        containerNodePath,
        constraints: [],
        whereFilter: '',
      })
      .setSupportedDataFormats(connection.supportedDataFormats);

    const dataModel = this.tableViewerStorageService.add(new DatabaseDataModel(source))
      .setCountGain(getDefaultRowsCount())
      .setSlice(0)
      .setAccess(connection.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    return dataModel;
  }
}
