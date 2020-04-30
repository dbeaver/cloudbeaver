/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


import { IExecutionContext } from '@dbeaver/data-viewer-plugin';

import { SqlExecutionState } from './SqlExecutionState';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

export interface ISqlQueryParams extends IExecutionContext {
  query: string;
}

export interface ISqlResultPanelParams {
  resultTabId: string; // to store tableView in tableViewStore
  indexInResultSet: number;
  sqlQueryParams: ISqlQueryParams;
  sqlExecutionState: SqlExecutionState;
  firstDataPortion: SQLQueryExecutionProcess;
}

export interface IResultsTabState {
  resultTabId: string; // to store tableView in tableViewStore
  // when query return several results they all have one groupId
  // new group id generates every time you execute query in new tab
  groupId: string;
  order: number;
  name: string;
  panelParams: ISqlResultPanelParams;
}

export interface ISqlEditorTabState extends IExecutionContext {
  order: number;
  query: string;
  currentResultTabId?: string;
  sqlExecutionState: SqlExecutionState;
  resultTabs: IResultsTabState[];
}
