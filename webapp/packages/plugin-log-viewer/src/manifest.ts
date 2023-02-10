/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { LogViewerBootstrap } from './LogViewer/LogViewerBootstrap';
import { LogViewerService } from './LogViewer/LogViewerService';
import { LogViewerSettingsService } from './LogViewer/LogViewerSettingsService';
import { SessionLogsEventHandler } from './SessionLogsEventHandler';
import { SessionLogsResource } from './SessionLogsResource';

export const logViewerPlugin: PluginManifest = {
  info: { name: 'Log viewer plugin' },
  providers: [
    LogViewerBootstrap,
    LogViewerService,
    LocaleService,
    LogViewerSettingsService,
    SessionLogsResource,
    SessionLogsEventHandler,
  ],
};