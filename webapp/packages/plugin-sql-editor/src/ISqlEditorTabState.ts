/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseExecutionContext } from '@cloudbeaver/plugin-data-viewer';

export interface ISqlQueryParams {
  query: string;
  executionContext: IDatabaseExecutionContext;
}

export interface IResultTab {
  tabId: string;
  // when query return several results they all have one groupId
  // new group id generates every time you execute query in new tab
  groupId: string;
  indexInResultSet: number;
}

export interface IResultGroup {
  groupId: string;
  modelId: string;
  sqlQueryParams: ISqlQueryParams;
  order: number;
}

export interface ISqlEditorResultTab {
  id: string;
  order: number;
  name: string;
  icon: string;
}

export interface IExecutionPlanTab {
  tabId: string;
  query: string;
  executionContext: IDatabaseExecutionContext;
  options?: Record<string, any>;
}

export interface ISqlEditorTabState {
  order: number;
  query: string;
  executionContext?: IDatabaseExecutionContext;
  currentTabId?: string;
  tabs: ISqlEditorResultTab[];
  resultGroups: IResultGroup[];
  resultTabs: IResultTab[];
  executionPlanTabs: IExecutionPlanTab[]; // TODO: ex-plan store addition info for tab
}
