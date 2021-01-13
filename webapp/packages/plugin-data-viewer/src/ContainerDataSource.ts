/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import { EDeferredState } from '@cloudbeaver/core-utils';

import { DatabaseDataSource } from './DatabaseDataModel/DatabaseDataSource';
import { IDatabaseDataResult } from './DatabaseDataModel/IDatabaseDataResult';
import { DataUpdate } from './DatabaseDataModel/IDatabaseDataSource';
import { FetchTableDataAsyncProcess } from './FetchTableDataAsyncProcess';
import { IExecutionContext } from './IExecutionContext';

export interface IDataContainerOptions {
  containerNodePath: string;
  connectionId: string;
  whereFilter: string;
  constraints: SqlDataFilterConstraint[];
}

export interface IDataContainerResult extends IDatabaseDataResult {

}

export class ContainerDataSource extends DatabaseDataSource<IDataContainerOptions, IDataContainerResult> {
  @observable currentFetchTableProcess: FetchTableDataAsyncProcess | null;
  private executionContext: IExecutionContext | null;

  get canCancel(): boolean {
    return this.currentFetchTableProcess ? this.currentFetchTableProcess.getState() === EDeferredState.PENDING : false;
  }

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
  ) {
    super();
    this.currentFetchTableProcess = null;
    this.executionContext = null;
  }

  cancel = (): boolean => {
    if (this.currentFetchTableProcess) {
      return this.currentFetchTableProcess.cancel();
    }
    throw new Error('currentFetchTableProcess must be provided to run cancel method');
  };

  async request(
    prevResults: IDataContainerResult[]
  ): Promise<IDataContainerResult[]> {
    if (!this.options?.containerNodePath) {
      throw new Error('containerNodePath must be provided for table');
    }

    const executionContext = await this.ensureContextCreated();
    const limit = this.count;

    const fetchTableProcess = new FetchTableDataAsyncProcess(this.graphQLService, this.notificationService);

    fetchTableProcess.start(
      {
        connectionId: executionContext.connectionId,
        contextId: executionContext.contextId,
        containerNodePath: this.options.containerNodePath,
      },
      {
        offset: this.offset,
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
      // allays returns false
      // || !result.resultSet?.hasMoreData,
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
