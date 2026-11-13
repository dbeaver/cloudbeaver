/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { LogViewerBootstrap } from './LogViewer/LogViewerBootstrap.js';
import { LogViewerService } from './LogViewer/LogViewerService.js';
import { LogViewerSettingsService } from './LogViewer/LogViewerSettingsService.js';
import { SessionLogsEventHandler } from './SessionLogsEventHandler.js';
import { SessionLogsResource } from './SessionLogsResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-log-viewer',

  services: () => [SessionLogsResource, SessionLogsEventHandler, LogViewerService, LogViewerSettingsService],
  bootstraps: () => [LocaleService, LogViewerBootstrap],
});
