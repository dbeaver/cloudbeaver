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
    name: 'GIS Viewer plugin',
  },
  providers: [() => import('./GISViewerBootstrap').then(m => m.GISViewerBootstrap), () => import('./LocaleService').then(m => m.LocaleService)],
};
