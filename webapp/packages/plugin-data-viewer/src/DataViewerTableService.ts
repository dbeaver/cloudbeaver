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
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataModel';
import { RowDiff } from './TableViewer/TableDataModel/EditedRow';
import { IRequestDataResult, TableViewerModel } from './TableViewer/TableViewerModel';
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

  async removeTableModel(tableId: string): Promise<void> {
    const model = this.tableViewerStorageService.get(tableId);
    if (model) {
      await model.dispose();
    }
    this.tableViewerStorageService.remove(tableId);
  }

  async create(
    tabId: string,
    connectionId: string,
    containerNodePath = ''
  ): Promise<TableViewerModel> {
    const connectionInfo = await this.connectionInfoResource.load(connectionId);
    const source = new ContainerDataSource(this.graphQLService, this.notificationService);

    const dataModel = this.tableViewerStorageService.create(
      {
        tableId: tabId,
        connectionId,
        containerNodePath,
        access: connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default,
        requestDataAsync: async (
          model: TableViewerModel,
          offset: number,
          count: number,
        ): Promise<IRequestDataResult> => {
          source.setOptions({
            connectionId,
            containerNodePath,
            constraints: Array.from(model.getSortedColumns()),
            whereFilter: '',
          });
          dataModel.setSlice(0, offset + count);
          await dataModel.requestData();

          const result = dataModel.getResult(0);

          if (!result) {
            throw new Error('Result not exists');
          }

          return {
            rows: result.data.rows!,
            columns: result.data.columns!,
            duration: dataModel.source.requestInfo.requestDuration,
            statusMessage: dataModel.source.requestInfo.requestMessage,
            isFullyLoaded: result.loadedFully,
          };
        },
        saveChanges: async (data: TableViewerModel, rows: RowDiff[]): Promise<IRequestDataResult> => {
          const result = dataModel.getResult(0);

          if (!result) {
            throw new Error('It is expected that result was set after first fetch');
          }

          return await source.saveDataDeprecated(result.id, rows);
        },
      },
      source
        .setOptions({
          connectionId,
          containerNodePath,
          constraints: [],
          whereFilter: '',
        })
        .setSupportedDataFormats(connectionInfo.supportedDataFormats)
    )
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    return dataModel.deprecatedModel;
  }
}
