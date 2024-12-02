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
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./SqlEditorService.js').then(m => m.SqlEditorService),
    () => import('./SqlDialectInfoService.js').then(m => m.SqlDialectInfoService),
    () => import('./SqlResultTabs/SqlQueryResultService.js').then(m => m.SqlQueryResultService),
    () => import('./SqlResultTabs/SqlQueryService.js').then(m => m.SqlQueryService),
    () => import('./SqlResultTabs/ExecutionPlan/SqlExecutionPlanService.js').then(m => m.SqlExecutionPlanService),
    () => import('./SqlResultTabs/SqlResultTabsService.js').then(m => m.SqlResultTabsService),
    () => import('./SqlEditorSettingsService.js').then(m => m.SqlEditorSettingsService),
    () => import('./SqlEditorModeService.js').then(m => m.SqlEditorModeService),
    () => import('./SqlEditorView.js').then(m => m.SqlEditorView),
    () => import('./MenuBootstrap.js').then(m => m.MenuBootstrap),
    () => import('./SqlDataSource/SqlDataSourceService.js').then(m => m.SqlDataSourceService),
    () => import('./SqlDataSource/LocalStorage/LocalStorageSqlDataSourceBootstrap.js').then(m => m.LocalStorageSqlDataSourceBootstrap),
    () => import('./SqlResultTabs/OutputLogs/OutputLogsEventHandler.js').then(m => m.OutputLogsEventHandler),
    () => import('./SqlResultTabs/OutputLogs/OutputLogsResource.js').then(m => m.OutputLogsResource),
    () => import('./SqlResultTabs/OutputLogs/OutputLogsService.js').then(m => m.OutputLogsService),
    () => import('./SqlResultTabs/OutputLogs/OutputMenuBootstrap.js').then(m => m.OutputMenuBootstrap),
    () => import('./SqlEditorGroupTabsBootstrap.js').then(m => m.SqlEditorGroupTabsBootstrap),
  ],
};
