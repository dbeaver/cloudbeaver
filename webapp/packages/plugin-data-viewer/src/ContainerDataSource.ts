/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { NotificationService } from '@cloudbeaver/core-events';
import type { GraphQLService, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import { EDeferredState } from '@cloudbeaver/core-utils';

import { DatabaseDataSource } from './DatabaseDataModel/DatabaseDataSource';
import type { IDatabaseDataResult } from './DatabaseDataModel/IDatabaseDataResult';
import type { DataUpdate } from './DatabaseDataModel/IDatabaseDataSource';
import { FetchTableDataAsyncProcess } from './FetchTableDataAsyncProcess';
import type { IExecutionContext } from './IExecutionContext';
import type { RowDiff } from './TableViewer/TableDataModel/EditedRow';
import type { IRequestDataResult } from './TableViewer/TableViewerModel';

export interface IDataContainerOptions {
  containerNodePath: string;
  sourceName?: string; // TODO: should be refactored, used only in QueryDataSource
  connectionId: string;
  whereFilter: string;
  constraints: SqlDataFilterConstraint[];
}

export interface IDataContainerResult extends IDatabaseDataResult {

}

export class ContainerDataSource extends DatabaseDataSource<IDataContainerOptions, IDataContainerResult> {
  currentFetchTableProcess: FetchTableDataAsyncProcess | null;

  get canCancel(): boolean {
    return this.currentFetchTableProcess?.getState() === EDeferredState.PENDING;
  }

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
  ) {
    super();

    makeObservable(this, {
      currentFetchTableProcess: observable,
    });

    this.currentFetchTableProcess = null;
    this.executionContext = null;
  }

  cancel(): boolean {
    if (this.currentFetchTableProcess) {
      return this.currentFetchTableProcess.cancel();
    }
    return false;
  }

  async request(
    prevResults: IDataContainerResult[]
  ): Promise<IDataContainerResult[]> {
    if (!this.options?.containerNodePath) {
      throw new Error('containerNodePath must be provided for table');
    }

    const executionContext = await this.ensureContextCreated();
    const offset = this.offset;
    const limit = this.count;

    const fetchTableProcess = new FetchTableDataAsyncProcess(this.graphQLService, this.notificationService);

    fetchTableProcess.start(
      {
        connectionId: executionContext.connectionId,
        contextId: executionContext.contextId,
        containerNodePath: this.options.containerNodePath,
      },
      {
        offset,
        limit,
        constraints: this.options.constraints,
        where: this.options.whereFilter || undefined,
      },
      this.dataFormat,
    );

    this.currentFetchTableProcess = fetchTableProcess;
    const response = await fetchTableProcess.promise;

    this.requestInfo = {
      requestDuration: response?.duration || 0,
      requestMessage: response?.statusMessage || '',
    };
    if (!response?.results) {
      return prevResults;
    }

    return response.results.map<IDataContainerResult>(result => ({
      id: result.resultSet?.id || '0',
      dataFormat: result.dataFormat!,
      loadedFully: (result.resultSet?.rows?.length || 0) < limit,
      data: result.resultSet,
    }));
  }

  async save(
    prevResults: IDataContainerResult[],
    data: DataUpdate
  ): Promise<IDataContainerResult[]> {
    const executionContext = await this.ensureContextCreated();

    const response = await this.graphQLService.sdk.updateResultsDataBatch({
      connectionId: executionContext.connectionId,
      contextId: executionContext.contextId,
      resultsId: data.data.id,
      // updatedRows: this.getRowsDiff(data),
    });

    this.requestInfo = {
      requestDuration: response.result?.duration || 0,
      requestMessage: 'Saved successfully',
    };

    throw new Error('Not implemented');
  }

  /**
   * @deprecated will be refactored
   */
  async saveDeprecated(resultId: string, rows: RowDiff[]): Promise<IRequestDataResult> {
    const executionContext = await this.ensureContextCreated();

    const response = await this.graphQLService.sdk.updateResultsDataBatch({
      connectionId: executionContext.connectionId,
      contextId: executionContext.contextId,
      resultsId: resultId,
      updatedRows: rows.map(row => ({ data: row.source, updateValues: row.values })),
    });

    const dataSet = response.result!.results[0].resultSet!; // we expect only one dataset for a table

    this.requestInfo = {
      requestDuration: response.result?.duration || 0,
      requestMessage: 'Saved successfully',
    };

    return {
      rows: dataSet.rows!,
      columns: [], // not in use while saving data
      duration: response.result!.duration,
      isFullyLoaded: false, // not in use while saving data
      statusMessage: 'Saved successfully',
    };
  }

  async dispose(): Promise<void> {
    if (this.executionContext) {
      await this.graphQLService.sdk.sqlContextDestroy({
        connectionId: this.executionContext.connectionId,
        contextId: this.executionContext.contextId,
      });
    }
  }

  private async ensureContextCreated(): Promise<IExecutionContext> {
    if (!this.executionContext) {
      if (!this.options) {
        throw new Error('Options must be provided');
      }
      this.executionContext = await this.createExecutionContext(this.options.connectionId);
    }
    return this.executionContext;
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
}
