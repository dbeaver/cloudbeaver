/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./ContextMenu/ConnectionMenuBootstrap.js').then(m => m.ConnectionMenuBootstrap),
    () => import('./PublicConnectionForm/PublicConnectionFormService.js').then(m => m.PublicConnectionFormService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ConnectionAuthService.js').then(m => m.ConnectionAuthService),
    () => import('./ConnectionForm/ConnectionFormService.js').then(m => m.ConnectionFormService),
    () => import('./ConnectionForm/Options/ConnectionOptionsTabService.js').then(m => m.ConnectionOptionsTabService),
    () => import('./ConnectionForm/DriverProperties/ConnectionDriverPropertiesTabService.js').then(m => m.ConnectionDriverPropertiesTabService),
    () => import('./ConnectionForm/SSH/ConnectionSSHTabService.js').then(m => m.ConnectionSSHTabService),
    () => import('./ConnectionForm/OriginInfo/ConnectionOriginInfoTabService.js').then(m => m.ConnectionOriginInfoTabService),
    () => import('./NavNodes/ConnectionFoldersBootstrap.js').then(m => m.ConnectionFoldersBootstrap),
    () => import('./ConnectionForm/SSL/ConnectionSSLTabService.js').then(m => m.ConnectionSSLTabService),
    () => import('./PluginConnectionsSettingsService.js').then(m => m.PluginConnectionsSettingsService),
    () => import('./NavNodes/ConnectionNavNodeService.js').then(m => m.ConnectionNavNodeService),
    () => import('./NavNodes/ConnectionsExplorerBootstrap.js').then(m => m.ConnectionsExplorerBootstrap),
  ],
};
