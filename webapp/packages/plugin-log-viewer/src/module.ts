/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SessionLogsResource } from './SessionLogsResource.js';
import { SessionLogsEventHandler } from './SessionLogsEventHandler.js';
import { LogViewerService } from './LogViewer/LogViewerService.js';
import { LogViewerBootstrap } from './LogViewer/LogViewerBootstrap.js';
import { LogViewerSettingsService } from './LogViewer/LogViewerSettingsService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-log-viewer',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(LogViewerSettingsService))
      .addSingleton(Dependency, proxy(SessionLogsResource))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, LogViewerBootstrap)
      .addSingleton(SessionLogsResource)
      .addSingleton(SessionLogsEventHandler)
      .addSingleton(LogViewerService)
      .addSingleton(LogViewerSettingsService);
  },
});
