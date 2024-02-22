/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IOutputLogType } from './SqlResultTabs/OutputLogs/IOutputLogTypes';

export interface IResultTab {
  tabId: string;
  // when query return several results they all have one groupId
  // new group id generates every time you execute query in new tab
  groupId: string;
  indexInResultSet: number;
}

export interface IStatisticsTab {
  tabId: string;
  order: number;
}

export interface IResultGroup {
  groupId: string;
  modelId: string;
  order: number;
  nameOrder: number;
  query: string;
}

export interface ISqlEditorResultTab {
  id: string;
  order: number;
  name: string;
  icon: string;
}

export interface ISqlEditorResultSetPresentation {
  presentationId: string;
  valuePresentationId: string | null;
}

export interface IExecutionPlanTab {
  tabId: string;
  order: number;
  query: string;
  options?: Record<string, any>;
}

export interface IOutputLogsTab extends ISqlEditorResultTab {
  selectedLogTypes: IOutputLogType[];
}

export interface ISqlEditorTabState {
  editorId: string;
  datasourceKey: string;

  source?: string;
  order: number;

  currentTabId?: string;
  tabs: ISqlEditorResultTab[];
  resultGroups: IResultGroup[];
  resultTabs: IResultTab[];
  statisticsTabs: IStatisticsTab[];
  executionPlanTabs: IExecutionPlanTab[];
  outputLogsTab?: IOutputLogsTab;

  // mode
  currentModeId?: string;
  modeState: Array<[string, any]>;
}
