/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import type { GraphQLService, SqlExecuteInfo } from '@cloudbeaver/core-sdk';
import { DatabaseDataEditor, DatabaseDataSource, IDatabaseDataOptions, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

export interface IDataQueryOptions extends IDatabaseDataOptions {
  query: string;
}

export class QueryDataSource extends DatabaseDataSource<IDataQueryOptions, IDatabaseResultSet> {
  currentTask: ITask<SqlExecuteInfo> | null;

  get canCancel(): boolean {
    return this.currentTask?.cancellable || false;
  }

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService
  ) {
    super();

    makeObservable(this, {
      currentTask: observable.ref,
    });

    this.currentTask = null;
    this.editor = new DatabaseDataEditor();
  }

  isDisabled(resultIndex: number): boolean {
    return (!this.getResult(resultIndex)?.data && this.error === null) || !this.executionContext?.context;
  }

  async cancel(): Promise<void> {
    if (this.currentTask) {
      await this.currentTask.cancel();
    }
  }

  async save(
    prevResults: IDatabaseResultSet[]
  ): Promise<IDatabaseResultSet[]> {
    if (!this.options || !this.executionContext?.context) {
      return prevResults;
    }

    const changes = this.editor?.getChanges(true);

    if (!changes) {
      return prevResults;
    }

    try {
      for (const update of changes) {
        const response = await this.graphQLService.sdk.updateResultsDataBatch({
          connectionId: this.options.connectionId,
          contextId: this.executionContext.context.id,
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
          source: this.options.query || null,
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
    } catch (exception) {
      this.error = exception;
      throw exception;
    }
    this.clearError();
    return prevResults;
  }

  setOptions(options: IDataQueryOptions): this {
    this.options = options;
    return this;
  }

  getResults(response: SqlExecuteInfo, limit: number): IDatabaseResultSet[] | null {
    this.requestInfo = {
      requestDuration: response.duration || 0,
      requestMessage: response.statusMessage || '',
      requestFilter: response.filterText || '',
      source: this.options?.query || null,
    };

    if (!response.results) {
      return null;
    }

    return response.results.map<IDatabaseResultSet>(result => ({
      id: result.resultSet?.id || '0',
      dataFormat: result.dataFormat!,
      updateRowCount: result.updateRowCount || 0,
      loadedFully: (result.resultSet?.rows?.length || 0) < limit,
      // allays returns false
      // || !result.resultSet?.hasMoreData,
      data: result.resultSet,
    }));
  }

  async request(
    prevResults: IDatabaseResultSet[]
  ): Promise<IDatabaseResultSet[]> {
    const options = this.options;
    const executionContext = this.executionContext;
    const executionContextInfo = this.executionContext?.context;

    if (!options || !executionContext || !executionContextInfo) {
      return prevResults;
    }
    const limit = this.count;

    const queryExecutionProcess = new SQLQueryExecutionProcess(this.graphQLService, this.notificationService);

    this.currentTask = executionContext.run(async () => {
      await queryExecutionProcess.start(
        options.query,
        executionContextInfo,
        {
          offset: this.offset,
          limit,
          constraints: options.constraints,
          where: options.whereFilter || undefined,
        },
        this.dataFormat
      );

      return await queryExecutionProcess.promise;
    }, () => { queryExecutionProcess.cancel(); });

    try {
      const response = await this.currentTask;

      const results = this.getResults(response, limit);
      this.clearError();

      if (!results) {
        return prevResults;
      }

      return results;
    } catch (exception) {
      this.error = exception;
      throw exception;
    }
  }

  async dispose(): Promise<void> {
    await this.cancel();
  }
}
