/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import type { QuotasService } from '@cloudbeaver/core-app';
import type { ConnectionExecutionContextService, IConnectionExecutionContext, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { IServiceInjector } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService, GraphQLService, ResultDataFormat, SqlExecuteInfo, SqlQueryResults, UpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';

import { DocumentEditAction } from './DatabaseDataModel/Actions/Document/DocumentEditAction';
import { ResultSetEditAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { DatabaseDataManager } from './DatabaseDataModel/DatabaseDataManager';
import { DatabaseDataSource } from './DatabaseDataModel/DatabaseDataSource';
import type { IDatabaseDataManager } from './DatabaseDataModel/IDatabaseDataManager';
import type { IDatabaseDataOptions } from './DatabaseDataModel/IDatabaseDataOptions';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';

export interface IDataContainerOptions extends IDatabaseDataOptions {
  containerNodePath: string;
}

export class ContainerDataSource extends DatabaseDataSource<IDataContainerOptions, IDatabaseResultSet> {
  currentTask: ITask<SqlExecuteInfo> | null;
  dataManager: IDatabaseDataManager;

  get canCancel(): boolean {
    return this.currentTask?.cancellable || false;
  }

  constructor(
    readonly serviceInjector: IServiceInjector,
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly quotasService: QuotasService,
  ) {
    super(serviceInjector);

    this.dataManager = new DatabaseDataManager(this.graphQLService, this.quotasService, this);
    this.currentTask = null;
    this.executionContext = null;

    makeObservable(this, {
      currentTask: observable.ref,
      canCancel: computed,
    });
  }

  isDisabled(resultIndex: number): boolean {
    return !this.getResult(resultIndex)?.data && this.error === null;
  }

  async cancel(): Promise<void> {
    if (this.currentTask) {
      await this.currentTask.cancel();
    }
  }

  async request(
    prevResults: IDatabaseResultSet[]
  ): Promise<IDatabaseResultSet[]> {
    const options = this.options;

    if (!options) {
      throw new Error('containerNodePath must be provided for table');
    }

    const executionContext = await this.ensureContextCreated();
    const offset = this.offset;
    const limit = this.count;

    let firstResultId: string | undefined;

    if (
      prevResults.length === 1
      && prevResults[0].contextId === executionContext.context!.id
      && prevResults[0].connectionId === executionContext.context?.connectionId
      && prevResults[0].id !== null
    ) {
      firstResultId = prevResults[0].id;
    }

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncReadDataFromContainer({
        connectionId: executionContext.context!.connectionId,
        contextId: executionContext.context!.id,
        containerNodePath: options.containerNodePath,
        resultId: firstResultId,
        filter: {
          offset,
          limit,
          constraints: options.constraints,
          where: options.whereFilter || undefined,
        },
        dataFormat: this.dataFormat,
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
      () => this.asyncTaskInfoService.remove(task.id)
    );

    try {
      const response = await this.currentTask;

      this.requestInfo = {
        requestDuration: response.duration || 0,
        requestMessage: response.statusMessage || '',
        requestFilter: response.filterText || '',
        source: null,
      };

      this.clearError();

      await this.closeResults(prevResults);

      return this.transformResults(executionContext.context!, response.results, limit);
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }
  }

  async save(
    prevResults: IDatabaseResultSet[]
  ): Promise<IDatabaseResultSet[]> {
    const executionContext = await this.ensureContextCreated();

    try {
      for (const result of prevResults) {
        if (result.id === null) {
          continue;
        }
        const executionContextInfo = executionContext.context!;
        const updateVariables: UpdateResultsDataBatchMutationVariables = {
          connectionId: executionContextInfo.connectionId,
          contextId: executionContextInfo.id,
          resultsId: result.id,
        };
        let editor: ResultSetEditAction | DocumentEditAction | undefined;

        if (result.dataFormat === ResultDataFormat.Resultset) {
          editor = this.actions.get(result, ResultSetEditAction);
          editor.fillBatch(updateVariables);
        } else if (result.dataFormat === ResultDataFormat.Document) {
          editor = this.actions.get(result, DocumentEditAction);
          editor.fillBatch(updateVariables);
        }

        const response = await this.graphQLService.sdk.updateResultsDataBatch(updateVariables);

        this.requestInfo = {
          ...this.requestInfo,
          requestDuration: response.result.duration,
          requestMessage: 'Saved successfully',
          source: null,
        };

        if (editor) {
          const responseResult = this.transformResults(executionContextInfo, response.result.results, 0)
            .find(newResult => newResult.id === result.id);

          if (responseResult) {
            editor.applyUpdate(responseResult);
          }
        }
      }
      this.clearError();
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }

    return prevResults;
  }

  async dispose(): Promise<void> {
    await this.closeResults(this.results);
    await this.executionContext?.destroy();
  }

  private async closeResults(results: IDatabaseResultSet[]) {
    await this.connectionExecutionContextService.load();

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

  private transformResults(
    executionContextInfo: IConnectionExecutionContextInfo,
    results: SqlQueryResults[],
    limit: number
  ): IDatabaseResultSet[] {
    return results.map<IDatabaseResultSet>(result => ({
      id: result.resultSet?.id || '0',
      uniqueResultId: `${executionContextInfo.connectionId}_${executionContextInfo.id}_${result.resultSet?.id || '0'}`,
      connectionId: executionContextInfo.connectionId,
      contextId: executionContextInfo.id,
      dataFormat: result.dataFormat!,
      updateRowCount: result.updateRowCount || 0,
      loadedFully: (result.resultSet?.rows?.length || 0) < limit,
      data: result.resultSet,
    }));
  }

  private async ensureContextCreated(): Promise<IConnectionExecutionContext> {
    if (!this.executionContext?.context) {
      if (!this.options) {
        throw new Error('Options must be provided');
      }
      this.executionContext = await this.connectionExecutionContextService.create(this.options.connectionId);
    }
    return this.executionContext;
  }
}
