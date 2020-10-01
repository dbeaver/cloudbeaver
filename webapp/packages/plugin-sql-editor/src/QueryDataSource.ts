/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { GraphQLService, ResultDataFormat, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import {
  DatabaseDataSource, DataUpdate, IDatabaseDataResult, IExecutionContext
} from '@cloudbeaver/plugin-data-viewer';

export interface IDataContainerOptions {
  sourceName: string;
  connectionId: string;
  whereFilter: string;
  constraints: SqlDataFilterConstraint[];
  dataFormat: ResultDataFormat;
}

export interface IDataContainerResult extends IDatabaseDataResult {

}

export class QueryDataSource extends DatabaseDataSource<IDataContainerOptions, IDataContainerResult> {
  private executionContext: IExecutionContext | null;

  constructor(private graphQLService: GraphQLService) {
    super();
    this.executionContext = null;
  }

  async request(
    prevResults: IDataContainerResult[]
  ): Promise<IDataContainerResult[]> {
    // if (!this.options?.containerNodePath) {
    //   throw new Error('containerNodePath must be provided for table');
    // }
    // const executionContext = await this.ensureContextCreated();

    // const { readDataFromContainer } = await this.graphQLService.sdk.readDataFromContainer({
    //   connectionId: executionContext.connectionId,
    //   contextId: executionContext.contextId,
    //   containerNodePath: this.options.containerNodePath,
    //   filter: {
    //     offset: this.offset,
    //     limit: this.count,
    //     constraints: this.options.constraints,
    //     where: this.options.whereFilter || undefined,
    //   },
    // });

    // this.requestInfo = {
    //   requestDuration: readDataFromContainer?.duration || 0,
    //   requestMessage: readDataFromContainer?.statusMessage || '',
    // };

    // return readDataFromContainer?.results.map<IDataContainerResult>(result => ({
    //   id: result.resultSet!.id,
    //   dataFormat: result.dataFormat!,
    //   loadedFully: (result.resultSet?.rows?.length || 0) < this.count || !result.resultSet?.hasMoreData,
    //   data: result.resultSet,
    // })) || prevResults;

    return prevResults;
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
