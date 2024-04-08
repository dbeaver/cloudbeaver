/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { MenuBootstrap } from './MenuBootstrap';
import { LocalStorageSqlDataSourceBootstrap } from './SqlDataSource/LocalStorage/LocalStorageSqlDataSourceBootstrap';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService';
import { SqlDialectInfoService } from './SqlDialectInfoService';
import { SqlEditorGroupTabsBootstrap } from './SqlEditorGroupTabsBootstrap';
import { SqlEditorModeService } from './SqlEditorModeService';
import { SqlEditorService } from './SqlEditorService';
import { SqlEditorSettingsService } from './SqlEditorSettingsService';
import { SqlEditorView } from './SqlEditorView';
import { SqlExecutionPlanService } from './SqlResultTabs/ExecutionPlan/SqlExecutionPlanService';
import { OutputLogsEventHandler } from './SqlResultTabs/OutputLogs/OutputLogsEventHandler';
import { OutputLogsResource } from './SqlResultTabs/OutputLogs/OutputLogsResource';
import { OutputLogsService } from './SqlResultTabs/OutputLogs/OutputLogsService';
import { OutputMenuBootstrap } from './SqlResultTabs/OutputLogs/OutputMenuBootstrap';
import { SqlQueryResultService } from './SqlResultTabs/SqlQueryResultService';
import { SqlQueryService } from './SqlResultTabs/SqlQueryService';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

export const sqlEditorPluginManifest: PluginManifest = {
  info: {
    name: 'Sql Editor Plugin',
  },

  providers: [
    LocaleService,
    SqlEditorService,
    SqlDialectInfoService,
    SqlQueryResultService,
    SqlQueryService,
    SqlExecutionPlanService,
    SqlResultTabsService,
    SqlEditorSettingsService,
    SqlEditorModeService,
    SqlEditorView,
    MenuBootstrap,
    SqlDataSourceService,
    LocalStorageSqlDataSourceBootstrap,
    OutputLogsEventHandler,
    OutputLogsResource,
    OutputLogsService,
    OutputMenuBootstrap,
    SqlEditorGroupTabsBootstrap,
  ],
};
