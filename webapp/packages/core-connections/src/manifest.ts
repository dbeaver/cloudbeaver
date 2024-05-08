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
    name: 'Core Connections',
  },

  providers: [
    () => import('./ConnectionFolderResource').then(m => m.ConnectionFolderResource),
    () => import('./ConnectionExecutionContext/ConnectionExecutionContextResource').then(m => m.ConnectionExecutionContextResource),
    () => import('./ConnectionExecutionContext/ConnectionExecutionContextService').then(m => m.ConnectionExecutionContextService),
    () => import('./ConnectionsManagerService').then(m => m.ConnectionsManagerService),
    () => import('./ConnectionInfoResource').then(m => m.ConnectionInfoResource),
    () => import('./ContainerResource').then(m => m.ContainerResource),
    () => import('./ConnectionsLocaleService').then(m => m.ConnectionsLocaleService),
    () => import('./DatabaseAuthModelsResource').then(m => m.DatabaseAuthModelsResource),
    () => import('./DBDriverResource').then(m => m.DBDriverResource),
    () => import('./NetworkHandlerResource').then(m => m.NetworkHandlerResource),
    () => import('./ConnectionDialectResource').then(m => m.ConnectionDialectResource),
    () => import('./NavTree/ConnectionNavNodeService').then(m => m.ConnectionNavNodeService),
    () => import('./NavTree/NavNodeExtensionsService').then(m => m.NavNodeExtensionsService),
    () => import('./ConnectionInfoEventHandler').then(m => m.ConnectionInfoEventHandler),
    () => import('./ConnectionFolderEventHandler').then(m => m.ConnectionFolderEventHandler),
    () => import('./ConnectionsSettingsService').then(m => m.ConnectionsSettingsService),
  ],
};
