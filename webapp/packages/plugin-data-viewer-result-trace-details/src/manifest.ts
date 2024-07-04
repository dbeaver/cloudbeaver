/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const dataViewerResultTraceDetailsPlugin: PluginManifest = {
  info: {
    name: 'Result trace details data viewer plugin',
  },

  providers: [
    () => import('./DVResultTraceDetailsBootstrap').then(m => m.DVResultTraceDetailsBootstrap),
    () => import('./DVResultTraceDetailsService').then(m => m.DVResultTraceDetailsService),
    () => import('./LocaleService').then(m => m.LocaleService),
  ],
};
