/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SqlQueryService } from './SqlResultTabs/SqlQueryService.js';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService.js';
import { SqlQueryResultService } from './SqlResultTabs/SqlQueryResultService.js';
import { OutputMenuBootstrap } from './SqlResultTabs/OutputLogs/OutputMenuBootstrap.js';
import { OutputLogsService } from './SqlResultTabs/OutputLogs/OutputLogsService.js';
import { OutputLogsResource } from './SqlResultTabs/OutputLogs/OutputLogsResource.js';
import { OutputLogsEventHandler } from './SqlResultTabs/OutputLogs/OutputLogsEventHandler.js';
import { SqlExecutionPlanService } from './SqlResultTabs/ExecutionPlan/SqlExecutionPlanService.js';
import { SqlEditorView } from './SqlEditorView.js';
import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';
import { SqlEditorService } from './SqlEditorService.js';
import { SqlEditorModeService } from './SqlEditorModeService.js';
import { SqlEditorGroupTabsBootstrap } from './SqlEditorGroupTabsBootstrap.js';
import { SqlDialectInfoService } from './SqlDialectInfoService.js';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import { LocalStorageSqlDataSourceBootstrap } from './SqlDataSource/LocalStorage/LocalStorageSqlDataSourceBootstrap.js';
import { MenuBootstrap } from './MenuBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(LocalStorageSqlDataSourceBootstrap))
      .addSingleton(Bootstrap, proxy(MenuBootstrap))
      .addSingleton(Bootstrap, proxy(OutputMenuBootstrap))
      .addSingleton(Bootstrap, proxy(SqlEditorGroupTabsBootstrap))
      .addSingleton(Dependency, proxy(SqlEditorSettingsService))
      .addSingleton(Dependency, proxy(OutputLogsResource))
      .addSingleton(SqlQueryService)
      .addSingleton(SqlResultTabsService)
      .addSingleton(SqlQueryResultService)
      .addSingleton(OutputMenuBootstrap)
      .addSingleton(OutputLogsService)
      .addSingleton(OutputLogsResource)
      .addSingleton(OutputLogsEventHandler)
      .addSingleton(SqlExecutionPlanService)
      .addSingleton(SqlEditorView)
      .addSingleton(SqlEditorSettingsService)
      .addSingleton(SqlEditorService)
      .addSingleton(SqlEditorModeService)
      .addSingleton(SqlEditorGroupTabsBootstrap)
      .addSingleton(SqlDialectInfoService)
      .addSingleton(SqlDataSourceService)
      .addSingleton(LocalStorageSqlDataSourceBootstrap)
      .addSingleton(MenuBootstrap);
  },
});
