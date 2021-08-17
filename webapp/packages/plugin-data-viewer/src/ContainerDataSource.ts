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
import { GraphQLService, ResultDataFormat, SqlExecuteInfo, SqlQueryResults, UpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';

import { DocumentEditAction } from './DatabaseDataModel/Actions/Document/DocumentEditAction';
import { ResultSetEditAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
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

      return this.transformResults(response.results, limit);
    } catch (exception) {
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
        const updateVariables: UpdateResultsDataBatchMutationVariables = {
          connectionId: executionContext.context!.connectionId,
          contextId: executionContext.context!.id,
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

        if (editor) {
          const responseResult = this.transformResults(response.result.results, 0)
            .find(newResult => newResult.id === result.id);

          if (responseResult) {
            editor.applyUpdate(responseResult);
          }

          this.requestInfo = {
            ...this.requestInfo,
            requestDuration: response.result.duration,
            requestMessage: 'Saved successfully',
            source: null,
          };
        }
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

  private transformResults(results: SqlQueryResults[], limit: number): IDatabaseResultSet[] {
    return results.map<IDatabaseResultSet>(result => ({
      id: result.resultSet?.id || '0',
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
