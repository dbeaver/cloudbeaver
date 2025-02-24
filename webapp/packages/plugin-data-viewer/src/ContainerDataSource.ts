/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { ConnectionExecutionContextService, IConnectionExecutionContext, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import type { AsyncTask, AsyncTaskInfoService } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  ResultDataFormat,
  type SqlExecuteInfo,
  type SqlQueryResults,
  type AsyncUpdateResultsDataBatchMutationVariables,
} from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { DocumentEditAction } from './DatabaseDataModel/Actions/Document/DocumentEditAction.js';
import type { IResultSetBlobValue } from './DatabaseDataModel/Actions/ResultSet/IResultSetBlobValue.js';
import { ResultSetEditAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetEditAction.js';
import type { IDatabaseDataOptions } from './DatabaseDataModel/IDatabaseDataOptions.js';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet.js';
import { ResultSetDataSource } from './ResultSet/ResultSetDataSource.js';

export interface IDataContainerOptions extends IDatabaseDataOptions {
  containerNodePath: string;
}

export class ContainerDataSource extends ResultSetDataSource<IDataContainerOptions> {
  currentTask: ITask<SqlExecuteInfo> | null;

  override get canCancel(): boolean {
    return this.currentTask?.cancellable || false;
  }

  override get cancelled(): boolean {
    return this.currentTask?.cancelled || false;
  }

  constructor(
    serviceProvider: IServiceProvider,
    graphQLService: GraphQLService,
    asyncTaskInfoService: AsyncTaskInfoService,
    protected connectionExecutionContextService: ConnectionExecutionContextService,
  ) {
    super(serviceProvider, graphQLService, asyncTaskInfoService);

    this.currentTask = null;
    this.executionContext = null;

    makeObservable(this, {
      currentTask: observable.ref,
      canCancel: computed,
    });
  }

  override isOutdated(): boolean {
    return super.isOutdated() || !this.executionContext?.context;
  }

  override async cancel(): Promise<void> {
    await super.cancel();
    await this.currentTask?.cancel();
  }

  async request(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    const executionContext = await this.ensureContextCreated();
    const context = executionContext.context!;
    const limit = this.count;
    const task = await this.getRequestTask(prevResults, context);

    this.currentTask = executionContext.run(
      async () => {
        const info = await this.asyncTaskInfoService.run(task);
        const { result } = await this.graphQLService.sdk.getSqlExecuteTaskResults({ taskId: info.id });

        return result;
      },
      () => this.asyncTaskInfoService.cancel(task.id),
      () => this.asyncTaskInfoService.remove(task.id),
    );

    try {
      const response = await this.currentTask;

      this.requestInfo = {
        originalQuery: response.fullQuery || '',
        requestDuration: response.duration || 0,
        requestMessage: response.statusMessage || '',
        requestFilter: response.filterText || '',
        source: null,
      };

      this.clearError();

      return this.transformResults(executionContext.context!, response.results, limit);
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }
  }

  async save(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    const executionContext = await this.ensureContextCreated();

    try {
      for (const result of prevResults) {
        if (result.id === null) {
          continue;
        }
        const executionContextInfo = executionContext.context!;
        const projectId = executionContextInfo.projectId;
        const connectionId = executionContextInfo.connectionId;
        const contextId = executionContextInfo.id;
        const resultsId = result.id;

        const updateVariables: AsyncUpdateResultsDataBatchMutationVariables = {
          projectId,
          connectionId,
          contextId,
          resultsId,
        };
        let editor: ResultSetEditAction | DocumentEditAction | undefined;

        if (result.dataFormat === ResultDataFormat.Resultset) {
          editor = this.actions.get(result, ResultSetEditAction);
        } else if (result.dataFormat === ResultDataFormat.Document) {
          editor = this.actions.get(result, DocumentEditAction);
        }

        let blobs: IResultSetBlobValue[] = [];
        if (editor instanceof ResultSetEditAction) {
          blobs = editor.getBlobsToUpload();
        }

        for (const blob of blobs) {
          const fileId = uuid();
          await this.graphQLService.sdk.uploadBlobResultSet(fileId, blob.blob);
          blob.fileId = fileId;
        }

        if (editor) {
          editor.fillBatch(updateVariables);
        }

        const task = this.asyncTaskInfoService.create(async () => {
          const { taskInfo } = await this.graphQLService.sdk.asyncUpdateResultsDataBatch(updateVariables);
          return taskInfo;
        });

        this.currentTask = executionContext.run(
          async () => {
            const info = await this.asyncTaskInfoService.run(task);
            const { result } = await this.graphQLService.sdk.getSqlExecuteTaskResults({ taskId: info.id });

            return result;
          },
          () => this.asyncTaskInfoService.cancel(task.id),
          () => this.asyncTaskInfoService.remove(task.id),
        );

        const response = await this.currentTask;

        if (editor) {
          const responseResult = this.transformResults(executionContextInfo, response.results, 0).find(newResult => newResult.id === result.id);

          if (responseResult) {
            editor.applyUpdate(responseResult);
          }
        }

        this.requestInfo = {
          ...this.requestInfo,
          requestDuration: response.duration,
          requestMessage: 'plugin_data_viewer_result_set_save_success',
          source: null,
        };
      }

      this.clearError();
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }

    return prevResults;
  }

  protected getConfig(prevResults: IDatabaseResultSet[], context: IConnectionExecutionContextInfo) {
    const options = this.options;

    if (!options) {
      throw new Error('Options must be provided');
    }

    const offset = this.offset;
    const limit = this.count;
    const resultId = this.getPreviousResultId(prevResults, context);

    return {
      projectId: context.projectId,
      connectionId: context.connectionId,
      contextId: context.id,
      containerNodePath: options.containerNodePath,
      resultId,
      filter: {
        offset,
        limit,
        constraints: options.constraints,
        where: options.whereFilter || undefined,
      },
      dataFormat: this.dataFormat,
    };
  }

  protected async getRequestTask(prevResults: IDatabaseResultSet[], context: IConnectionExecutionContextInfo): Promise<AsyncTask> {
    const task = this.asyncTaskInfoService.create(async () => {
      const config = this.getConfig(prevResults, context);
      const { taskInfo } = await this.graphQLService.sdk.asyncReadDataFromContainer(config);
      return taskInfo;
    });

    return task;
  }

  override setExecutionContext(context: IConnectionExecutionContext | null): this {
    super.setExecutionContext(context);

    for (const result of this.results) {
      result.id = null;
    }

    return this;
  }

  private transformResults(executionContextInfo: IConnectionExecutionContextInfo, results: SqlQueryResults[], limit: number): IDatabaseResultSet[] {
    return results.map<IDatabaseResultSet>((result, index) => ({
      id: result.resultSet?.id || '0',
      uniqueResultId: `${executionContextInfo.connectionId}_${executionContextInfo.id}_${index}`,
      projectId: executionContextInfo.projectId,
      connectionId: executionContextInfo.connectionId,
      contextId: executionContextInfo.id,
      dataFormat: result.dataFormat!,
      updateRowCount: result.updateRowCount || 0,
      loadedFully: (result.resultSet?.rowsWithMetaData?.length || 0) < limit,
      count: result.resultSet?.rowsWithMetaData?.length || 0,
      totalCount: null,
      data: result.resultSet,
    }));
  }

  private async ensureContextCreated(): Promise<IConnectionExecutionContext> {
    const currentContext = this.executionContext?.context;

    if (!currentContext) {
      if (!this.options) {
        throw new Error('Options must be provided');
      }

      const executionContext = await this.connectionExecutionContextService.create(
        this.options.connectionKey,
        this.options.catalog,
        this.options.schema,
      );

      this.setExecutionContext(executionContext);
    }

    return this.executionContext!;
  }
}
