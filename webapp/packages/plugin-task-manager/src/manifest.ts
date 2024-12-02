/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const taskManagerPluginManifest: PluginManifest = {
  info: { name: 'Task Manager plugin' },
  providers: [
    () => import('./TaskManagerPluginBootstrap.js').then(m => m.TaskManagerPluginBootstrap),
    () => import('./LocaleService.js').then(m => m.LocaleService),
  ],
};
