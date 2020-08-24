/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IExecutionContext } from '@cloudbeaver/plugin-data-viewer';

export interface ISqlQueryParams extends IExecutionContext {
  query: string;
}

export interface IResultExecutionInfo {
  resultTabId: string; // to store tableView in tableViewStore
  indexInResultSet: number;
  sqlQueryParams: ISqlQueryParams;
}

export interface IResultDataTab {
  resultTabId: string; // to store tableView in tableViewStore
  // when query return several results they all have one groupId
  // new group id generates every time you execute query in new tab
  groupId: string;
  order: number;
  indexInResultSet: number;
  name: string;
}

export interface IQueryTabGroup {
  order: number;
  groupId: string;
  sqlQueryParams: ISqlQueryParams;
}

export interface ISqlEditorTabState extends IExecutionContext {
  order: number;
  query: string;
  currentResultTabId?: string;
  queryTabGroups: IQueryTabGroup[];
  resultTabs: IResultDataTab[];
}
