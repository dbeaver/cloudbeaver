/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const logViewerPlugin: PluginManifest = {
  info: { name: 'Log viewer plugin' },
  providers: [
    () => import('./LogViewer/LogViewerBootstrap.js').then(m => m.LogViewerBootstrap),
    () => import('./LogViewer/LogViewerService.js').then(m => m.LogViewerService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./LogViewer/LogViewerSettingsService.js').then(m => m.LogViewerSettingsService),
    () => import('./SessionLogsResource.js').then(m => m.SessionLogsResource),
    () => import('./SessionLogsEventHandler.js').then(m => m.SessionLogsEventHandler),
  ],
};
