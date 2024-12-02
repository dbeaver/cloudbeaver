/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';
import { type IDataQueryOptions, QueryDataSource } from '@cloudbeaver/plugin-sql-editor';

export interface IDataGroupingOptions extends IDataQueryOptions {
  query: string;
  sourceResultId: string;
  columns: string[];
  functions: string[];
  showDuplicatesOnly: boolean;
}

export class GroupingDataSource extends QueryDataSource<IDataGroupingOptions> {
  override async request(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    await this.generateQuery();
    return await super.request(prevResults);
  }

  private async generateQuery(): Promise<void> {
    const options = this.options;
    const executionContextInfo = this.executionContext?.context;

    if (!options || !executionContextInfo) {
      return;
    }

    try {
      const { query } = await this.graphQLService.sdk.getResultsetGroupingQuery({
        projectId: executionContextInfo.projectId,
        connectionId: executionContextInfo.connectionId,
        contextId: executionContextInfo.id,
        resultsId: options.sourceResultId,
        columnNames: options.columns,
        functions: options.functions,
        showDuplicatesOnly: options.showDuplicatesOnly || false,
      });

      this.setOptions({ ...options, query });
    } catch (exception: any) {
      this.error = exception;
      throw exception;
    }
  }
}
