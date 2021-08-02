/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ConnectionExecutionContextService, IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import type { GraphQLService, SqlExecuteInfo } from '@cloudbeaver/core-sdk';

import { DatabaseDataEditor } from './DatabaseDataModel/DatabaseDataEditor';
import { DatabaseDataSource } from './DatabaseDataModel/DatabaseDataSource';
import type { IDatabaseDataOptions } from './DatabaseDataModel/IDatabaseDataOptions';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';
import { FetchTableDataAsyncProcess } from './FetchTableDataAsyncProcess';

export interface IDataContainerOptions extends IDatabaseDataOptions {
  containerNodePath: string;
}

export class ContainerDataSource extends DatabaseDataSource<IDataContainerOptions, IDatabaseResultSet> {
  currentTask: ITask<SqlExecuteInfo> | null;

  get canCancel(): boolean {
    return this.currentTask?.cancellable || false;
  }

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private connectionExecutionContextService: ConnectionExecutionContextService
  ) {
    super();

    this.currentTask = null;
    this.executionContext = null;
    this.editor = new DatabaseDataEditor();
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

    const fetchTableProcess = new FetchTableDataAsyncProcess(this.graphQLService, this.notificationService);

    this.currentTask = executionContext.run(async () => {
      await fetchTableProcess.start(
        {
          connectionId: executionContext.context!.connectionId,
          contextId: executionContext.context!.id,
          containerNodePath: options.containerNodePath,
        },
        {
          offset,
          limit,
          constraints: options.constraints,
          where: options.whereFilter || undefined,
        },
        this.dataFormat,
      );

      return fetchTableProcess.promise;
    }, () => { fetchTableProcess.cancel(); });

    try {
      const response = await this.currentTask;

      this.requestInfo = {
        requestDuration: response?.duration || 0,
        requestMessage: response?.statusMessage || '',
        requestFilter: response.filterText || '',
        source: null,
      };

      this.clearError();

      if (!response?.results) {
        return prevResults;
      }

      return response.results.map<IDatabaseResultSet>(result => ({
        id: result.resultSet?.id || '0',
        dataFormat: result.dataFormat!,
        updateRowCount: result.updateRowCount || 0,
        loadedFully: (result.resultSet?.rows?.length || 0) < limit,
        data: result.resultSet,
      }));
    } catch (exception) {
      this.error = exception;
      throw exception;
    }
  }

  async save(
    prevResults: IDatabaseResultSet[]
  ): Promise<IDatabaseResultSet[]> {
    const executionContext = await this.ensureContextCreated();

    const changes = this.editor?.getChanges(true);

    if (!changes) {
      return prevResults;
    }

    try {
      for (const update of changes) {
        const response = await this.graphQLService.sdk.updateResultsDataBatch({
          connectionId: executionContext.context!.connectionId,
          contextId: executionContext.context!.id,
          resultsId: update.resultId,
          updatedRows: Array.from(update.diff.values()).map(diff => ({
            data: diff.source,
            updateValues: diff.update.reduce((obj, value, index) => {
              if (value !== diff.source[index]) {
                obj[index] = value;
              }
              return obj;
            }, {}),
          })),
        });

        this.requestInfo = {
          ...this.requestInfo,
          requestDuration: response.result?.duration || 0,
          requestMessage: 'Saved successfully',
          source: null,
        };

        const result = prevResults.find(result => result.id === update.resultId)!;
        const responseResult = response.result?.results.find(result => result.resultSet?.id === update.resultId);

        if (responseResult?.resultSet?.rows && result.data?.rows) {
          let i = 0;
          for (const row of update.diff.keys()) {
            result.data.rows[row] = responseResult.resultSet.rows[i];
            i++;
          }
        }

        this.editor?.cancelResultChanges(result);
      }
      this.clearError();
    } catch (exception) {
      this.error = exception;
      throw exception;
    }

    return prevResults;
  }

  async dispose(): Promise<void> {
    await this.executionContext?.destroy();
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
