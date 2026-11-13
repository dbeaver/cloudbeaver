/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { MenuBootstrap } from './MenuBootstrap.js';
import { LocalStorageSqlDataSourceBootstrap } from './SqlDataSource/LocalStorage/LocalStorageSqlDataSourceBootstrap.js';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import { SqlDialectInfoService } from './SqlDialectInfoService.js';
import { SqlEditorGroupTabsBootstrap } from './SqlEditorGroupTabsBootstrap.js';
import { SqlEditorModelFactory } from './SqlEditorModel/SqlEditorModelFactory.js';
import { SqlEditorModelService } from './SqlEditorModel/SqlEditorModelService.js';
import { SqlEditorModeService } from './SqlEditorModeService.js';
import { SqlEditorPermissionService } from './SqlEditorPermissionService.js';
import { SqlEditorService } from './SqlEditorService.js';
import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';
import { SqlEditorView } from './SqlEditorView.js';
import { OutputLogsEventHandler } from './SqlResultTabs/OutputLogs/OutputLogsEventHandler.js';
import { OutputLogsResource } from './SqlResultTabs/OutputLogs/OutputLogsResource.js';
import { OutputLogsService } from './SqlResultTabs/OutputLogs/OutputLogsService.js';
import { OutputMenuBootstrap } from './SqlResultTabs/OutputLogs/OutputMenuBootstrap.js';
import { SqlQueryResultService } from './SqlResultTabs/SqlQueryResultService.js';
import { SqlQueryService } from './SqlResultTabs/SqlQueryService.js';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService.js';
import { SqlScriptErrorService } from './SqlResultTabs/SqlScriptErrorService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor',

  services: () => [
    SqlQueryService,
    SqlScriptErrorService,
    SqlResultTabsService,
    SqlQueryResultService,
    OutputMenuBootstrap,
    OutputLogsService,
    OutputLogsResource,
    OutputLogsEventHandler,
    SqlEditorView,
    SqlEditorSettingsService,
    SqlEditorService,
    SqlEditorModeService,
    SqlEditorGroupTabsBootstrap,
    SqlDialectInfoService,
    SqlDataSourceService,
    LocalStorageSqlDataSourceBootstrap,
    SqlEditorModelService,
    SqlEditorModelFactory,
    MenuBootstrap,
    SqlEditorPermissionService,
  ],
  bootstraps: () => [LocaleService, LocalStorageSqlDataSourceBootstrap, MenuBootstrap, OutputMenuBootstrap, SqlEditorGroupTabsBootstrap],
});
