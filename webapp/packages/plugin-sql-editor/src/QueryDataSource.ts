/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SqlDataFilterConstraint, SqlExecuteInfo } from '@cloudbeaver/core-sdk';
import {
  DatabaseDataSource, DataUpdate, IDatabaseDataResult
} from '@cloudbeaver/plugin-data-viewer';

import { ISqlEditorGroupMetadata } from './ISqlEditorGroupMetadata';
import { IQueryTabGroup } from './ISqlEditorTabState';
import { SqlEditorGroupMetadataService } from './SqlEditorGroupMetadataService';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

export interface IDataContainerOptions {
  tabId: string;
  resultTabId: string;
  sourceName: string;
  connectionId: string;
  whereFilter: string;
  constraints: SqlDataFilterConstraint[];
  group: IQueryTabGroup;
}

export interface IDataContainerResult extends IDatabaseDataResult {

}

export class QueryDataSource extends DatabaseDataSource<IDataContainerOptions, IDataContainerResult> {
  canCancel: boolean;

  sqlProcess: SQLQueryExecutionProcess | null = null;
  private metadata!: ISqlEditorGroupMetadata;

  constructor(
    private sqlEditorGroupMetadataService: SqlEditorGroupMetadataService,
    private sqlResultTabsService: SqlResultTabsService
  ) {
    super();
    this.canCancel = false;
  }

  cancel(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  save(
    prevResults: IDataContainerResult[],
    data: DataUpdate<any>
  ): IDataContainerResult[] | Promise<IDataContainerResult[]> {
    throw new Error('Method not implemented.');
  }

  setOptions(options: IDataContainerOptions): this {
    this.options = options;
    this.metadata = this.sqlEditorGroupMetadataService.getTabData(options.resultTabId);
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
    this.metadata.start(
      sqlExecutionContext,
      this.options.group.sqlQueryParams,
      {
        offset: this.offset,
        limit,
        constraints: this.options.constraints,
        where: this.options.whereFilter || undefined,
      },
      this.dataFormat
    );

    this.sqlProcess = this.metadata.resultDataProcess;
    const response = await this.metadata.resultDataProcess.promise;

    const results = this.getResults(response, limit);

    if (!results) {
      return prevResults;
    }

    return results;
  }

  async dispose(): Promise<void> {
    if (!this.options) {
      return;
    }

    await this.metadata.dispose(this.options.group.sqlQueryParams);
  }
}
