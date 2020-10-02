/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource } from './ContainerDataSource';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataModel';
import { IExecutionContext } from './IExecutionContext';
import { RowDiff } from './TableViewer/TableDataModel/EditedRow';
import { IRequestDataResult, TableViewerModel } from './TableViewer/TableViewerModel';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

@injectable()
export class DataViewerTableService {
  constructor(private tableViewerStorageService: TableViewerStorageService,
              private connectionInfoResource: ConnectionInfoResource,
              private graphQLService: GraphQLService) {
  }

  has(tableId: string): boolean {
    return this.tableViewerStorageService.has(tableId);
  }

  removeTableModel(tableId: string): void {
    this.tableViewerStorageService.remove(tableId);
  }

  async create(
    tabId: string,
    connectionId: string,
    containerNodePath = '',
  ): Promise<TableViewerModel> {
    const connectionInfo = await this.connectionInfoResource.load(connectionId);

    return this.tableViewerStorageService.create(
      {
        tableId: tabId,
        connectionId,
        containerNodePath,
        access: connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default,
        requestDataAsync: this.requestDataAsync.bind(this),
        saveChanges: this.saveChanges.bind(this),
      },
      new ContainerDataSource(this.graphQLService)
        .setOptions({
          connectionId,
          containerNodePath,
          constraints: [],
          whereFilter: '',
        })
        .setSupportedDataFormats(connectionInfo.supportedDataFormats)
    )
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default)
      .deprecatedModel;
  }

  private async createExecutionContext(
    connectionId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<IExecutionContext> {

    const response = await this.graphQLService.sdk.sqlContextCreate({
      connectionId,
      defaultCatalog,
      defaultSchema,
    });
    return {
      contextId: response.context.id,
      connectionId,
      objectCatalogId: response.context.defaultCatalog,
      objectSchemaId: response.context.defaultSchema,
    };
  }

  private async saveChanges(data: TableViewerModel, rows: RowDiff[]): Promise<IRequestDataResult> {
    if (!data.resultId) {
      throw new Error('It is expected that resultId was set after first fetch');
    }

    if (!data.executionContext) {
      throw new Error('It is expected that data.sqlContextParams was set after first fetch');
    }

    const response = await this.graphQLService.sdk.updateResultsDataBatch({
      connectionId: data.executionContext.connectionId,
      contextId: data.executionContext.contextId,
      resultsId: data.resultId,
      updatedRows: rows.map(row => ({ data: row.source, updateValues: row.values })),
    });

    const dataSet = response.result!.results[0].resultSet!; // we expect only one dataset for a table

    const result: IRequestDataResult = {
      rows: dataSet.rows!,
      columns: [], // not in use while saving data
      duration: response.result!.duration,
      isFullyLoaded: false, // not in use while saving data
      statusMessage: 'Saved successfully',
    };
    return result;
  }

  private async requestDataAsync(
    model: TableViewerModel,
    offset: number,
    count: number
  ): Promise<IRequestDataResult> {
    if (!model.containerNodePath) {
      throw new Error('containerNodePath must be provided for table');
    }
    if (!model.executionContext) {

      // it is first data request
      const executionContext: IExecutionContext = await this.createExecutionContext(model.connectionId);
      model.executionContext = executionContext;
    }

    const { readDataFromContainer } = await this.graphQLService.sdk.readDataFromContainer({
      connectionId: model.executionContext.connectionId,
      contextId: model.executionContext.contextId,
      containerNodePath: model.containerNodePath,
      filter: {
        offset,
        limit: count,
        constraints: Array.from(model.getSortedColumns()),
        where: model.getQueryWhereFilter() || undefined,
      },
    });
    const dataSet = readDataFromContainer!.results[0].resultSet!; // we expect only one dataset for a table
    model.resultId = dataSet.id; // server generates new resultId on each fetch

    const result: IRequestDataResult = {
      rows: dataSet.rows!,
      columns: dataSet.columns!,
      duration: readDataFromContainer!.duration,
      statusMessage: readDataFromContainer!.statusMessage || '',
      isFullyLoaded: (dataSet.rows?.length || 0) < count,
    };
    return result;
  }
}
