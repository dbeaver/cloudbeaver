/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { GraphQLService } from '@dbeaver/core/sdk';

import { RowDiff } from './TableViewer/TableDataModel/EditedRow';
import { IRequestDataResult, ITableViewerModelInit, TableViewerModel } from './TableViewer/TableViewerModel';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

interface ISqlContextParams {
  contextId: string;
  connectionId: string;
  objectCatalogId?: string;
  objectSchemaId?: string;

}

export interface IDataViewerTableModel {
  tableId: string;
  connectionId: string;
  resultId: string | null;
  sqlContextParams: ISqlContextParams | null;
}

@injectable()
export class DataViewerTableService {

  constructor(private tableViewerStorageService: TableViewerStorageService,
              private connectionsManagerService: ConnectionsManagerService,
              private commonDialogService: CommonDialogService,
              private graphQLService: GraphQLService) {
  }

  createTableModelIfNotExists(tableId: string): void {
    if (!this.tableViewerStorageService.hasTableModel(tableId)) {
      const tableModel = this.createTableModel(tableId);
      this.tableViewerStorageService.addTableModel(tableId, tableModel);
    }
  }

  removeTableModel(tableId: string): void {
    this.tableViewerStorageService.removeTableModel(tableId);
  }

  private createTableModel(tableId: string): TableViewerModel {
    // todo delete this dirty trick. pass connection id with tableId
    const connection = this.connectionsManagerService.connections.find(c => tableId.includes(c.id));

    const tableModel: IDataViewerTableModel = {
      tableId,
      connectionId: connection!.id,
      sqlContextParams: null, // will be filled before fist data fetch
      resultId: null, // will be filled after fist data fetch
    };

    const callbacks: ITableViewerModelInit = {
      requestDataAsync: (rowOffset, count: number) => this.requestDataAsync(tableModel, rowOffset, count),
      saveChanges: diffs => this.saveChanges(tableModel, diffs),
    };
    return new TableViewerModel(callbacks, this.commonDialogService);
  }

  private async createSqlContext(
    connectionId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<ISqlContextParams> {

    const response = await this.graphQLService.gql.sqlContextCreate({
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

  private async saveChanges(data: IDataViewerTableModel, rows: RowDiff[]): Promise<IRequestDataResult> {
    const firstRow = rows[0]; // we support updating only one value

    if (!data.resultId) {
      throw new Error('It is expected that resultId was set after first fetch');
    }

    if (!data.sqlContextParams) {
      throw new Error('It is expected that data.sqlContextParams was set after first fetch');
    }

    const response = await this.graphQLService.gql.updateResultsData({
      connectionId: data.sqlContextParams.connectionId,
      contextId: data.sqlContextParams.contextId,
      resultsId: data.resultId,
      sourceRowValues: firstRow.source,
      values: firstRow.values,
    });

    const dataSet = response.result.results[0].resultSet; // we expect only one dataset for a table

    const result: IRequestDataResult = {
      rows: dataSet.rows!,
      columns: [], // not in use while saving data
      duration: response.result.duration,
      isFullyLoaded: false, // not in use while saving data
      statusMessage: 'Saved successfully',
    };
    return result;
  }

  private async requestDataAsync(data: IDataViewerTableModel,
                                 rowOffset: number,
                                 count: number): Promise<IRequestDataResult> {
    if (!data.sqlContextParams) {

      // it is first data request
      const sqlContextParams: ISqlContextParams = await this.createSqlContext(data.connectionId);
      data.sqlContextParams = sqlContextParams;
    }

    const { readDataFromContainer } = await this.graphQLService.gql.readDataFromContainer({
      connectionId: data.sqlContextParams.connectionId,
      contextId: data.sqlContextParams.contextId,
      containerNodePath: data.tableId,
      filter: {
        offset: rowOffset,
        limit: count,
      },
    });
    const dataSet = readDataFromContainer.results[0].resultSet; // we expect only one dataset for a table
    data.resultId = dataSet.id; // server generates new resultId on each fetch

    const result: IRequestDataResult = {
      rows: dataSet.rows!,
      columns: dataSet.columns,
      duration: readDataFromContainer.duration,
      statusMessage: readDataFromContainer.statusMessage || '',
      isFullyLoaded: (dataSet.rows?.length || 0) < count,
    };
    return result;
  }
}
