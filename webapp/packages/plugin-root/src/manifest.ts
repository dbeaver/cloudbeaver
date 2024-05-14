/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const rootPlugin: PluginManifest = {
  info: { name: 'Root plugin' },
  providers: [
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./ServerNodeChangedDialog/ServerNodeChangedDialogService').then(m => m.ServerNodeChangedDialogService),
    () => import('./NetworkStateNotification/NetworkStateNotificationService').then(m => m.NetworkStateNotificationService),
    () => import('./DataSynchronization/DataSynchronizationResolverBootstrap').then(m => m.DataSynchronizationResolverBootstrap),
  ],
};
