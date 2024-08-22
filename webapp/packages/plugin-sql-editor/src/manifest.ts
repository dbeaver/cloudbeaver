/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const sqlEditorPluginManifest: PluginManifest = {
  info: {
    name: 'Sql Editor Plugin',
  },

  providers: [
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./SqlEditorService').then(m => m.SqlEditorService),
    () => import('./SqlDialectInfoService').then(m => m.SqlDialectInfoService),
    () => import('./SqlResultTabs/SqlQueryResultService').then(m => m.SqlQueryResultService),
    () => import('./SqlResultTabs/SqlQueryService').then(m => m.SqlQueryService),
    () => import('./SqlResultTabs/ExecutionPlan/SqlExecutionPlanService').then(m => m.SqlExecutionPlanService),
    () => import('./SqlResultTabs/SqlResultTabsService').then(m => m.SqlResultTabsService),
    () => import('./SqlEditorSettingsService').then(m => m.SqlEditorSettingsService),
    () => import('./SqlEditorModeService').then(m => m.SqlEditorModeService),
    () => import('./SqlEditorView').then(m => m.SqlEditorView),
    () => import('./MenuBootstrap').then(m => m.MenuBootstrap),
    () => import('./SqlDataSource/SqlDataSourceService').then(m => m.SqlDataSourceService),
    () => import('./SqlDataSource/LocalStorage/LocalStorageSqlDataSourceBootstrap').then(m => m.LocalStorageSqlDataSourceBootstrap),
    () => import('./SqlResultTabs/OutputLogs/OutputLogsEventHandler').then(m => m.OutputLogsEventHandler),
    () => import('./SqlResultTabs/OutputLogs/OutputLogsResource').then(m => m.OutputLogsResource),
    () => import('./SqlResultTabs/OutputLogs/OutputLogsService').then(m => m.OutputLogsService),
    () => import('./SqlResultTabs/OutputLogs/OutputMenuBootstrap').then(m => m.OutputMenuBootstrap),
    () => import('./SqlEditorGroupTabsBootstrap').then(m => m.SqlEditorGroupTabsBootstrap),
  ],
};
