/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const manifest: PluginManifest = {
  info: {
    name: 'Core Projects',
  },

  providers: [
    () => import('./ProjectsService.js').then(m => m.ProjectsService),
    () => import('./ProjectInfoResource.js').then(m => m.ProjectInfoResource),
    () => import('./ProjectInfoEventHandler.js').then(m => m.ProjectInfoEventHandler),
    () => import('./LocaleService.js').then(m => m.LocaleService),
  ],
};
