/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

import { OUTPUT_LOG_TYPES } from './SqlResultTabs/OutputLogs/IOutputLogTypes';

export const RESULT_TAB_SCHEME = schema.object({
  tabId: schema.string(),
  groupId: schema.string(),
  indexInResultSet: schema.number(),
  presentationId: schema.string(),
  valuePresentationId: schema.nullable(schema.string()),
});

export type IResultTab = schema.infer<typeof RESULT_TAB_SCHEME>;

export const STATISTIC_TAB_SCHEME = schema.object({
  tabId: schema.string(),
  order: schema.number(),
});

export type IStatisticsTab = schema.infer<typeof STATISTIC_TAB_SCHEME>;

export const RESULT_GROUP_SCHEME = schema.object({
  groupId: schema.string(),
  modelId: schema.string(),
  order: schema.number(),
  nameOrder: schema.number(),
  query: schema.string(),
});

export type IResultGroup = schema.infer<typeof RESULT_GROUP_SCHEME>;

export const SQL_EDITOR_RESULT_TAB_SCHEME = schema.object({
  id: schema.string(),
  order: schema.number(),
  name: schema.string(),
  icon: schema.string(),
});

export type ISqlEditorResultTab = schema.infer<typeof SQL_EDITOR_RESULT_TAB_SCHEME>;

export const EXECUTION_PLAN_TAB_SCHEME = schema.object({
  tabId: schema.string(),
  order: schema.number(),
  query: schema.string(),
  options: schema.record(schema.any()).optional(),
});

export type IExecutionPlanTab = schema.infer<typeof EXECUTION_PLAN_TAB_SCHEME>;

const OUTPUT_LOGS_TAB_SCHEME = SQL_EDITOR_RESULT_TAB_SCHEME.extend({
  selectedLogTypes: schema.array(schema.enum(OUTPUT_LOG_TYPES)),
});

export type IOutputLogsTab = schema.infer<typeof OUTPUT_LOGS_TAB_SCHEME>;

export const SQL_EDITOR_TAB_STATE_SCHEME = schema.object({
  editorId: schema.string(),
  datasourceKey: schema.string(),
  source: schema.string().optional(),
  order: schema.number(),
  currentTabId: schema.string().optional(),
  tabs: schema.array(SQL_EDITOR_RESULT_TAB_SCHEME),
  resultGroups: schema.array(RESULT_GROUP_SCHEME),
  resultTabs: schema.array(RESULT_TAB_SCHEME),
  statisticsTabs: schema.array(STATISTIC_TAB_SCHEME),
  executionPlanTabs: schema.array(EXECUTION_PLAN_TAB_SCHEME),
  outputLogsTab: OUTPUT_LOGS_TAB_SCHEME.optional(),
  currentModeId: schema.string().optional(),
  modeState: schema.array(schema.tuple([schema.string(), schema.any()])),
});

export type ISqlEditorTabState = schema.infer<typeof SQL_EDITOR_TAB_STATE_SCHEME>;
