/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { createConnectionParam, type IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { executorHandlerFilter, type IExecutorHandler, type ITask } from '@cloudbeaver/core-executor';
import {
  AsyncTask,
  AsyncTaskInfoEventHandler,
  AsyncTaskInfoService,
  ClientEventId,
  ServerEventId,
  type IBaseAsyncTaskEvent,
} from '@cloudbeaver/core-root';
import {
  GraphQLService,
  ResultDataFormat,
  type SqlExecuteInfo,
  type SqlQueryResults,
  type AsyncUpdateResultsDataBatchMutationVariables,
  type AsyncTaskInfo,
  type WsSessionTaskQueryParamsConfirmationEvent,
  type WsSessionTaskWithParametersConfirmationEvent,
} from '@cloudbeaver/core-sdk';
import { isArraysEqual, uuid } from '@cloudbeaver/core-utils';
import {
  DocumentEditAction,
  type IDatabaseDataOptions,
  type IDatabaseResultSet,
  type IRequestInfo,
  type IResultSetBlobValue,
  ResultSetDataSource,
  ResultSetEditAction,
} from '@cloudbeaver/plugin-data-viewer';
import { DialogueStateResult, type CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { renderQueryParamsForConfirmation } from './renderQueryParamsForConfirmation.js';

export interface IDataQueryOptions extends IDatabaseDataOptions {
  query: string;
}

export interface IQueryRequestInfo extends IRequestInfo {
  query: string;
}

export class QueryDataSource<TOptions extends IDataQueryOptions = IDataQueryOptions> extends ResultSetDataSource<TOptions> {
  currentTask: ITask<SqlExecuteInfo> | null;
  override requestInfo: IQueryRequestInfo;

  override get canCancel(): boolean {
    return this.currentTask?.cancellable || false;
  }

  override get cancelled(): boolean {
    return this.currentTask?.cancelled || false;
  }

  private previousQueryParameters: Record<string, any> | null;
  private currentQueryParameters: Record<string, any> | null;
  private currentQueryAsyncTask: AsyncTask | null;
  private queryParamsEventHandler: IExecutorHandler<IBaseAsyncTaskEvent, any>;
  constructor(
    override readonly serviceProvider: IServiceProvider,
    private readonly commonDialogService: CommonDialogService,
    private readonly asyncTaskInfoEventHandler: AsyncTaskInfoEventHandler,
    graphQLService: GraphQLService,
    asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    super(serviceProvider, graphQLService, asyncTaskInfoService);

    this.previousQueryParameters = null;
    this.currentQueryParameters = null;
    this.currentTask = null;
    this.requestInfo = {
      originalQuery: '',
      requestDuration: 0,
      requestMessage: '',
      requestFilter: '',
      source: null,
      query: '',
    };
    this.currentQueryAsyncTask = null;

    this.handleQueryParamsEvent = this.handleQueryParamsEvent.bind(this);
    this.queryParamsEventHandler = executorHandlerFilter(
      event => event.id === ServerEventId.CbSessionTaskQueryParamsConfirmationRequest && event.taskId === this.currentQueryAsyncTask?.info?.id,
      this.handleQueryParamsEvent,
    );
    asyncTaskInfoService.onExecuteEvent.addHandler(this.queryParamsEventHandler);

    makeObservable(this, {
      currentTask: observable.ref,
    });
  }

  override isDisabled(resultIndex?: number): boolean {
    return super.isDisabled(resultIndex) || !this.executionContext?.context;
  }

  override async cancel(): Promise<void> {
    await super.cancel();
    await this.currentTask?.cancel();
  }

  override refreshData(): Promise<void> {
    this.resetQueryParameters();
    return super.refreshData();
  }

  async save(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    const executionContext = this.executionContext;

    if (!this.options || !executionContext?.context) {
      return prevResults;
    }

    try {
      for (const result of prevResults) {
        if (result.id === null) {
          continue;
        }

        const executionContextInfo = executionContext.context;
        const projectId = this.options.connectionKey.projectId;
        const connectionId = this.options.connectionKey.connectionId;
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
          await this.graphQLService.sdk.uploadBlobResultSet(fileId, blob.blob!);
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
            editor.applyUpdate(responseResult.id, responseResult.data?.rowsWithMetaData?.map(r => r.data) || []);
          }
        }

        this.requestInfo = {
          ...this.requestInfo,
          requestDuration: response.duration,
          requestMessage: 'plugin_data_viewer_result_set_save_success',
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

  override setOptions(options: TOptions): this {
    if (this.options?.query !== options.query) {
      this.resetQueryParameters();
    }
    this.options = options;
    return this;
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

    if (this.requestInfo.query === this.options?.query) {
      firstResultId = this.getPreviousResultId(prevResults, executionContextInfo);
    }

    const task = this.asyncTaskInfoService.create(() => this.executeQuery(executionContextInfo, options, firstResultId, limit));
    this.currentQueryAsyncTask = task;

    this.currentTask = executionContext.run(
      async () => {
        const info = await this.asyncTaskInfoService.run(task);
        const { result } = await this.graphQLService.sdk.getSqlExecuteTaskResults({ taskId: info.id });

        return result;
      },
      () => this.asyncTaskInfoService.cancel(task.id),
      () => {
        this.asyncTaskInfoService.remove(task.id);
        this.currentQueryAsyncTask = null;
      },
    );

    try {
      const response = await this.currentTask;

      const results = this.innerGetResults(executionContextInfo, response, limit);
      this.clearError();

      if (!results) {
        return prevResults;
      }

      return results;
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }
  }

  resetQueryParameters(): void {
    this.previousQueryParameters = this.currentQueryParameters || this.previousQueryParameters;
    this.currentQueryParameters = null;
  }

  protected async executeQuery(
    executionContextInfo: IConnectionExecutionContextInfo,
    options: TOptions,
    firstResultId: string | undefined,
    limit: number,
  ): Promise<AsyncTaskInfo> {
    const { taskInfo } = await this.graphQLService.sdk.asyncSqlExecuteQuery({
      projectId: executionContextInfo.projectId,
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
      isInteractive: true,
    });

    return taskInfo;
  }

  override async dispose(): Promise<void> {
    await super.dispose();
    this.asyncTaskInfoService.onExecuteEvent.removeHandler(this.queryParamsEventHandler);
  }

  private async handleQueryParamsEvent(event: IBaseAsyncTaskEvent) {
    const queryParamsEvent = event as WsSessionTaskQueryParamsConfirmationEvent;
    const canUseQueryParameters =
      this.currentQueryParameters && isArraysEqual(Object.keys(this.currentQueryParameters), Object.keys(queryParamsEvent.parameters));

    if (!canUseQueryParameters) {
      const parametersState = observable({
        ...Object.fromEntries(Object.entries(queryParamsEvent.parameters).map(([key, value]) => [key, this.previousQueryParameters?.[key] ?? value])),
      });
      const connectionKey = this.executionContext?.context
        ? createConnectionParam(this.executionContext.context.projectId, this.executionContext.context.connectionId)
        : null;

      // TODO: this UI thing should be moved outside of the `plugin-sql-editor` package to use sql editor component for preview
      //       it is partially fixed, but still this UI code should be somewhere else
      const dialogPromise = this.commonDialogService.open(ConfirmationDialog, {
        title: queryParamsEvent.title,
        message: queryParamsEvent.message,
        size: 'large',
        noOverflow: true,
        children: () => renderQueryParamsForConfirmation(connectionKey, parametersState, queryParamsEvent.query),
      });

      const { status } = await dialogPromise;
      if (status === DialogueStateResult.Resolved) {
        this.currentQueryParameters = { ...parametersState };
      }
    }

    if (this.currentQueryParameters) {
      this.asyncTaskInfoEventHandler.emit<WsSessionTaskWithParametersConfirmationEvent>({
        id: ClientEventId.CbClientSessionTaskWithParametersConfirmation,
        taskId: queryParamsEvent.taskId,
        parameters: this.currentQueryParameters,
      });
    } else {
      await this.currentQueryAsyncTask?.cancelAsync();
    }
  }

  private innerGetResults(
    executionContextInfo: IConnectionExecutionContextInfo,
    response: SqlExecuteInfo,
    limit: number,
  ): IDatabaseResultSet[] | null {
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

  private transformResults(executionContextInfo: IConnectionExecutionContextInfo, results: SqlQueryResults[], limit: number): IDatabaseResultSet[] {
    return results.map<IDatabaseResultSet>((result, index) => ({
      id: result.resultSet?.id || null,
      uniqueResultId: `${executionContextInfo.connectionId}_${executionContextInfo.id}_${result.dataFormat}_${index}`,
      projectId: executionContextInfo.projectId,
      connectionId: executionContextInfo.connectionId,
      contextId: executionContextInfo.id,
      dataFormat: result.dataFormat!,
      updateRowCount: result.updateRowCount || 0,
      loadedFully: (result.resultSet?.rowsWithMetaData?.length || 0) < limit,
      count: result.resultSet?.rowsWithMetaData?.length || 0,
      totalCount: null,
      // allays returns false
      // || !result.resultSet?.hasMoreData,
      data: result.resultSet,
    }));
  }
}
