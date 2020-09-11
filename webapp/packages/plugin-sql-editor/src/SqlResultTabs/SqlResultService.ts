/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, SqlExecuteInfo } from '@cloudbeaver/core-sdk';
import { IRequestDataResult, RowDiff } from '@cloudbeaver/plugin-data-viewer';

import { ISqlQueryParams } from '../ISqlEditorTabState';

@injectable()
export class SqlResultService {

  constructor(private graphQLService: GraphQLService) { }

  async saveChanges(
    sqlQueryParams: ISqlQueryParams,
    resultId: string,
    diff: RowDiff[]
  ): Promise<SqlExecuteInfo> {

    const response = await this.graphQLService.sdk.updateResultsDataBatch({
      connectionId: sqlQueryParams.connectionId,
      contextId: sqlQueryParams.contextId,
      resultsId: resultId,
      updatedRows: diff.map(row => ({ data: row.source, updateValues: row.values })),
    });

    return response.result!;
  }

  sqlExecuteInfoToData(result: SqlExecuteInfo, indexInResultSet: number, count?: number): IRequestDataResult {
    const dataSet = result.results ? result.results[indexInResultSet]?.resultSet : null;
    if (!dataSet) {
      throw new Error(`Dataset with indexInResultSet ${indexInResultSet} not found`);
    }

    const dataResults: IRequestDataResult = {
      rows: dataSet.rows!,
      columns: dataSet.columns || [],
      duration: result.duration,
      statusMessage: result.statusMessage || 'Ok',
      isFullyLoaded: count !== undefined
        ? (dataSet.rows?.length || 0) < count
        : false, // case of saveChanges method, where this flag is not in use
    };
    return dataResults;
  }

}
