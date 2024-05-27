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
    () => import('./LogViewer/LogViewerBootstrap').then(m => m.LogViewerBootstrap),
    () => import('./LogViewer/LogViewerService').then(m => m.LogViewerService),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./LogViewer/LogViewerSettingsService').then(m => m.LogViewerSettingsService),
    () => import('./SessionLogsResource').then(m => m.SessionLogsResource),
    () => import('./SessionLogsEventHandler').then(m => m.SessionLogsEventHandler),
  ],
};
