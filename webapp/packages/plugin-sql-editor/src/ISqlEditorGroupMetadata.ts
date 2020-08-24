/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SqlDataFilter } from '@cloudbeaver/core-sdk';

import { ISqlQueryParams } from './ISqlEditorTabState';
import { SqlExecutionState } from './SqlExecutionState';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

export interface ISqlEditorGroupMetadata {
  start(
    context: SqlExecutionState,
    sqlQueryParams: ISqlQueryParams,
    filter: SqlDataFilter
  ): Promise<SQLQueryExecutionProcess>;
  resultDataProcess: SQLQueryExecutionProcess;
}
