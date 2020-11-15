/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat, SqlDataFilter } from '@cloudbeaver/core-sdk';

import { ISqlQueryParams } from './ISqlEditorTabState';
import { SqlExecutionState } from './SqlExecutionState';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

export interface ISqlEditorGroupMetadata {
  resultDataProcess: SQLQueryExecutionProcess;
  start: (
    context: SqlExecutionState,
    sqlQueryParams: ISqlQueryParams,
    filter: SqlDataFilter,
    dataFormat: ResultDataFormat,
  ) => Promise<SQLQueryExecutionProcess>;
  dispose: (params: ISqlQueryParams) => Promise<void>;
}
