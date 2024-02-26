/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

export const SQL_EDITOR_RESULT_TAB_SCHEME = schema.object({
  id: schema.coerce.string(),
  order: schema.coerce.number(),
  name: schema.coerce.string(),
  icon: schema.coerce.string(),
});

export const RESULT_GROUP_SCHEME = schema.object({
  groupId: schema.coerce.string(),
  name: schema.coerce.string(),
  order: schema.coerce.number(),
  nameOrder: schema.coerce.number(),
  query: schema.coerce.string(),
});

export const RESULT_TAB_SCHEME = schema.object({
  tabId: schema.coerce.string(),
  groupId: schema.coerce.string(),
  indexInResultSet: schema.coerce.number(),
  presentationId: schema.coerce.string(),
  valuePresentationId: schema.nullable(schema.coerce.string()),
});

export const STATISTIC_TAB_SCHEME = schema.object({
  tabId: schema.coerce.string(),
  order: schema.coerce.number(),
});

export const EXECUTION_PLAN_SCHEME = schema.object({
  tabId: schema.coerce.string(),
  order: schema.coerce.number(),
  query: schema.coerce.string(),
  options: schema.record(schema.any()).optional(),
});

export const OUTPUT_LOGS_TAB_SCHEME = SQL_EDITOR_RESULT_TAB_SCHEME.extend({
  selectedLogTypes: schema.array(schema.string()),
});

export const SQL_EDITOR_TAB_STATE_SCHEME = schema.object({
  editorId: schema.coerce.string(),
  datasourceKey: schema.coerce.string(),
  source: schema.coerce.string().optional(),
  order: schema.coerce.number(),
  currentTabId: schema.coerce.string().optional(),
  tabs: schema.array(SQL_EDITOR_RESULT_TAB_SCHEME),
  resultGroups: schema.array(RESULT_GROUP_SCHEME),
  resultTabs: schema.array(RESULT_TAB_SCHEME),
  statisticsTabs: schema.array(STATISTIC_TAB_SCHEME),
  executionPlanTabs: schema.array(EXECUTION_PLAN_SCHEME),
  outputLogsTab: OUTPUT_LOGS_TAB_SCHEME.optional(),
  currentModeId: schema.coerce.string().optional(),
  modeState: schema.array(schema.any()),
});
