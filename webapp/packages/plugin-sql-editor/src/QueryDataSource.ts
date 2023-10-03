/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { IServiceInjector } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import {
  AsyncTaskInfoService,
  GraphQLService,
  ResultDataFormat,
  SqlExecuteInfo,
  SqlQueryResults,
  UpdateResultsDataBatchMutationVariables,
} from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';
import {
  DatabaseDataSource,
  DocumentEditAction,
  IDatabaseDataOptions,
  IDatabaseResultSet,
  IRequestInfo,
  IResultSetContentValue,
  ResultSetEditAction,
} from '@cloudbeaver/plugin-data-viewer';

export interface IDataQueryOptions extends IDatabaseDataOptions {
  query: string;
}

export interface IQueryRequestInfo extends IRequestInfo {
  query: string;
}

export class QueryDataSource<TOptions extends IDataQueryOptions = IDataQueryOptions> extends DatabaseDataSource<TOptions, IDatabaseResultSet> {
  currentTask: ITask<SqlExecuteInfo> | null;
  requestInfo: IQueryRequestInfo;

  get canCancel(): boolean {
    return this.currentTask?.cancellable || false;
  }

  get cancelled(): boolean {
    return this.currentTask?.cancelled || false;
  }

  constructor(
    readonly serviceInjector: IServiceInjector,
    protected readonly graphQLService: GraphQLService,
    protected readonly asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    super(serviceInjector);

    this.currentTask = null;
    this.requestInfo = {
      originalQuery: '',
      requestDuration: 0,
      requestMessage: '',
      requestFilter: '',
      source: null,
      query: '',
    };

    makeObservable(this, {
      currentTask: observable.ref,
    });
  }

  isLoadable(): boolean {
    return super.isLoadable() && !!this.executionContext?.context;
  }

  isReadonly(resultIndex: number): boolean {
    return super.isReadonly(resultIndex) || this.getResult(resultIndex)?.data?.hasRowIdentifier === false;
  }

  isDisabled(resultIndex: number): boolean {
    return (!this.getResult(resultIndex)?.data && this.error === null) || !this.executionContext?.context;
  }

  async cancel(): Promise<void> {
    if (this.currentTask) {
      await this.currentTask.cancel();
    }
  }

  async save(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    if (!this.options || !this.executionContext?.context) {
      return prevResults;
    }

    try {
      for (const result of prevResults) {
        if (result.id === null) {
          continue;
        }

        const executionContextInfo = this.executionContext.context;
        const projectId = this.options.connectionKey.projectId;
        const connectionId = this.options.connectionKey.connectionId;
        const contextId = executionContextInfo.id;
        const resultsId = result.id;

        const updateVariables: UpdateResultsDataBatchMutationVariables = {
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

        let blobs: IResultSetContentValue[] = [];
        if (editor instanceof ResultSetEditAction) {
          blobs = editor.getBlobsToUpload();
        }

        for (const blob of blobs) {
          const fileId = uuid();
          await this.graphQLService.sdk.uploadBlobResultSet(fileId, blob.blob!);
          blob.fileId = fileId;
        }

        if (editor) {
          editor.fillBatch(updateVariables);
        }

        const response = await this.graphQLService.sdk.updateResultsDataBatch(updateVariables);

        if (editor) {
          const responseResult = this.transformResults(executionContextInfo, response.result.results, 0).find(
            newResult => newResult.id === result.id,
          );

          if (responseResult) {
            editor.applyPartialUpdate(responseResult);
          }
        }

        this.requestInfo = {
          ...this.requestInfo,
          requestDuration: response.result.duration,
          requestMessage: 'Saved successfully',
          source: this.options.query,
        };
      }
      this.clearError();
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }
    return prevResults;
  }

  setOptions(options: TOptions): this {
    this.options = options;
    return this;
  }

  getResults(executionContextInfo: IConnectionExecutionContextInfo, response: SqlExecuteInfo, limit: number): IDatabaseResultSet[] | null {
    this.requestInfo = {
      originalQuery: response.fullQuery || this.options?.query || '',
      requestDuration: response.duration || 0,
      requestMessage: response.statusMessage || '',
      requestFilter: response.filterText || '',
      source: this.options?.query || null,
      query: this.options?.query || '',
    };

    if (!response.results) {
      return null;
    }

    return this.transformResults(executionContextInfo, response.results, limit);
  }

  async request(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    const options = this.options;
    const executionContext = this.executionContext;
    const executionContextInfo = this.executionContext?.context;

    if (!options || !executionContext || !executionContextInfo) {
      return prevResults;
    }
    const limit = this.count;

    let firstResultId: string | undefined;

    if (
      prevResults.length === 1 &&
      prevResults[0].contextId === executionContext.context!.id &&
      prevResults[0].connectionId === executionContext.context?.connectionId &&
      prevResults[0].id !== null &&
      this.requestInfo.query === this.options?.query
    ) {
      firstResultId = prevResults[0].id;
    }

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlExecuteQuery({
        connectionId: executionContextInfo.connectionId,
        contextId: executionContextInfo.id,
        query: options.query,
        resultId: firstResultId,
        filter: {
          offset: this.offset,
          limit,
          constraints: options.constraints,
          where: options.whereFilter || undefined,
        },
        dataFormat: this.dataFormat,
        readLogs: options.readLogs,
      });

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

    try {
      const response = await this.currentTask;

      const results = this.getResults(executionContextInfo, response, limit);
      this.clearError();

      if (!results) {
        return prevResults;
      }

      this.closeResults(prevResults);

      return results;
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }
  }

  private async closeResults(results: IDatabaseResultSet[]) {
    if (!this.executionContext?.context) {
      return;
    }

    for (const result of results) {
      if (result.id === null) {
        continue;
      }
      try {
        await this.graphQLService.sdk.closeResult({
          connectionId: result.connectionId,
          contextId: result.contextId,
          resultId: result.id,
        });
      } catch (exception: any) {
        console.log(`Error closing result (${result.id}):`, exception);
      }
    }
  }

  private transformResults(executionContextInfo: IConnectionExecutionContextInfo, results: SqlQueryResults[], limit: number): IDatabaseResultSet[] {
    return results.map<IDatabaseResultSet>((result, index) => ({
      id: result.resultSet?.id || null,
      uniqueResultId: `${executionContextInfo.connectionId}_${executionContextInfo.id}_${index}`,
      connectionId: executionContextInfo.connectionId,
      contextId: executionContextInfo.id,
      dataFormat: result.dataFormat!,
      updateRowCount: result.updateRowCount || 0,
      loadedFully: (result.resultSet?.rows?.length || 0) < limit,
      // allays returns false
      // || !result.resultSet?.hasMoreData,
      data: result.resultSet,
    }));
  }

  async dispose(): Promise<void> {
    await this.closeResults(this.results);
    await this.cancel();
  }
}
