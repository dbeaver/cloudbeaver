/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const connectionPlugin: PluginManifest = {
  info: {
    name: 'Connections plugin',
  },

  providers: [
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./ContextMenu/ConnectionMenuBootstrap').then(m => m.ConnectionMenuBootstrap),
    () => import('./PublicConnectionForm/PublicConnectionFormService').then(m => m.PublicConnectionFormService),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./ConnectionAuthService').then(m => m.ConnectionAuthService),
    () => import('./ConnectionForm/ConnectionFormService').then(m => m.ConnectionFormService),
    () => import('./ConnectionForm/Options/ConnectionOptionsTabService').then(m => m.ConnectionOptionsTabService),
    () => import('./ConnectionForm/DriverProperties/ConnectionDriverPropertiesTabService').then(m => m.ConnectionDriverPropertiesTabService),
    () => import('./ConnectionForm/SSH/ConnectionSSHTabService').then(m => m.ConnectionSSHTabService),
    () => import('./ConnectionForm/OriginInfo/ConnectionOriginInfoTabService').then(m => m.ConnectionOriginInfoTabService),
    () => import('./NavNodes/ConnectionFoldersBootstrap').then(m => m.ConnectionFoldersBootstrap),
    () => import('./ConnectionForm/SSL/ConnectionSSLTabService').then(m => m.ConnectionSSLTabService),
    () => import('./PluginConnectionsSettingsService').then(m => m.PluginConnectionsSettingsService),
  ],
};
