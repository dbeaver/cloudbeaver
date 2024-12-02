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
    name: 'Plugin Authentication',
  },

  providers: [
    () => import('./AuthenticationService.js').then(m => m.AuthenticationService),
    () => import('./Dialog/AuthDialogService.js').then(m => m.AuthDialogService),
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./AuthenticationLocaleService.js').then(m => m.AuthenticationLocaleService),
    () => import('./UserLoadingErrorDialogBootstrap.js').then(m => m.UserLoadingErrorDialogBootstrap),
  ],
};
