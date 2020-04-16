/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IConnectionCatalogSchema, ITabHasConnectionChangeBehavior } from '@dbeaver/core/app';

import { SqlExecutionState } from './SqlExecutionState';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

export interface ISqlContextParams extends IConnectionCatalogSchema {
  contextId: string;
}

export interface ISqlQueryParams extends ISqlContextParams {
  query: string;
}

export interface ISqlResultPanelParams {
  resultTabId: string; // to store tableView in tableViewStore
  resultId: string | null; // returns from the server, new id returns after each data fetch
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

export interface ISqlEditorTabState extends ITabHasConnectionChangeBehavior {
  order: number;
  query: string;
  contextId: string;
  currentResultTabId?: string;
  sqlExecutionState: SqlExecutionState;
  resultTabs: IResultsTabState[];
}
