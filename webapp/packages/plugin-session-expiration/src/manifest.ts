/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const sessionExpirationPlugin: PluginManifest = {
  info: { name: 'Session Expiration plugin' },
  providers: [
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./SessionExpireDialog/SessionExpiredDialogBootstrap').then(m => m.SessionExpiredDialogBootstrap),
    () => import('./SessionExpireWarningDialog/SessionExpireWarningDialogBootstrap').then(m => m.SessionExpireWarningDialogBootstrap),
    () => import('./LocaleService').then(m => m.LocaleService),
  ],
};
