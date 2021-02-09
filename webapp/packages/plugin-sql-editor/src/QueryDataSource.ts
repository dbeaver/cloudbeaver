/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { NotificationService } from '@cloudbeaver/core-events';
import type { GraphQLService, SqlDataFilterConstraint, SqlExecuteInfo, SqlResultSet } from '@cloudbeaver/core-sdk';
import { EDeferredState } from '@cloudbeaver/core-utils';
import {
  DatabaseDataEditor,
  DatabaseDataSource, IDatabaseDataResult, IRequestDataResult, RowDiff
} from '@cloudbeaver/plugin-data-viewer';

import type { IQueryTabGroup } from './ISqlEditorTabState';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';
import type { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

export interface IDataContainerOptions {
  tabId: string;
  sourceName: string;
  connectionId: string;
  whereFilter: string;
  constraints: SqlDataFilterConstraint[];
  group: IQueryTabGroup;
}

export interface IDataContainerResult extends IDatabaseDataResult {
  data: SqlResultSet | undefined;
}

export class QueryDataSource extends DatabaseDataSource<IDataContainerOptions, IDataContainerResult> {
  get canCancel(): boolean {
    return this.queryExecutionProcess?.getState() === EDeferredState.PENDING;
  }

  queryExecutionProcess: SQLQueryExecutionProcess | null;

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private sqlResultTabsService: SqlResultTabsService
  ) {
    super();

    makeObservable(this, {
      queryExecutionProcess: observable,
    });

    this.queryExecutionProcess = null;
    this.editor = new DatabaseDataEditor();
  }

  cancel(): boolean {
    if (this.queryExecutionProcess) {
      this.queryExecutionProcess.cancel();
    }
    return false;
  }

  async save(
    prevResults: IDataContainerResult[]
  ): Promise<IDataContainerResult[]> {
    const params = this.options?.group.sqlQueryParams;
    if (!params) {
      throw new Error('sqlQueryParams must be provided');
    }

    const changes = this.editor?.getChanges();

    if (!changes) {
      return prevResults;
    }

    for (const update of changes) {
      const response = await this.graphQLService.sdk.updateResultsDataBatch({
        connectionId: params.connectionId,
        contextId: params.contextId,
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
        requestDuration: response.result?.duration || 0,
        requestMessage: 'Saved successfully',
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

    return prevResults;
  }

  setOptions(options: IDataContainerOptions): this {
    this.options = options;
    return this;
  }

  getResults(response: SqlExecuteInfo, limit: number): IDataContainerResult[] | null {
    this.requestInfo = {
      requestDuration: response.duration || 0,
      requestMessage: response.statusMessage || '',
    };

    if (!response.results) {
      return null;
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

  async request(
    prevResults: IDataContainerResult[]
  ): Promise<IDataContainerResult[]> {
    if (!this.options) {
      return prevResults;
    }
    const limit = this.count;
    const sqlExecutionContext = this.sqlResultTabsService.getTabExecutionContext(this.options.tabId);

    this.queryExecutionProcess = new SQLQueryExecutionProcess(this.graphQLService, this.notificationService);

    sqlExecutionContext.setCurrentlyExecutingQuery(this.queryExecutionProcess);

    await this.queryExecutionProcess.start(
      this.options.group.sqlQueryParams,
      {
        offset: this.offset,
        limit,
        constraints: this.options.constraints,
        where: this.options.whereFilter || undefined,
      },
      this.dataFormat
    );

    const response = await this.queryExecutionProcess.promise;

    const results = this.getResults(response, limit);

    if (!results) {
      return prevResults;
    }

    return results;
  }

  async saveDeprecated(resultId: string, rows: RowDiff[]): Promise<IRequestDataResult> {
    const params = this.options?.group.sqlQueryParams;
    if (!params) {
      throw new Error('sqlQueryParams must be provided');
    }

    const response = await this.graphQLService.sdk.updateResultsDataBatch({
      connectionId: params.connectionId,
      contextId: params.contextId,
      resultsId: resultId,
      updatedRows: rows.map(row => ({ data: row.source, updateValues: row.values })),
    });

    const dataSet = response.result?.results[0].resultSet; // we expect only one dataset for a save

    if (!dataSet) {
      throw new Error('Response result wasn\'t provided');
    }

    this.requestInfo = {
      requestDuration: response.result?.duration || 0,
      requestMessage: 'Saved successfully',
    };

    return {
      rows: dataSet.rows!,
      columns: [], // not in use while saving data
      duration: response.result?.duration,
      isFullyLoaded: false, // not in use while saving data
      statusMessage: 'Saved successfully',
    };
  }

  async dispose(): Promise<void> {
    // TODO: this.queryExecutionProcess maybe should be disposed somehow
  }
}
