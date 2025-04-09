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
    () => import('./ConnectionFolderResource.js').then(m => m.ConnectionFolderResource),
    () => import('./ConnectionExecutionContext/ConnectionExecutionContextResource.js').then(m => m.ConnectionExecutionContextResource),
    () => import('./ConnectionExecutionContext/ConnectionExecutionContextService.js').then(m => m.ConnectionExecutionContextService),
    () => import('./ConnectionsManagerService.js').then(m => m.ConnectionsManagerService),
    () => import('./ConnectionInfoResource.js').then(m => m.ConnectionInfoResource),
    () => import('./ConnectionInfoOriginResource.js').then(m => m.ConnectionInfoOriginResource),
    () => import('./ConnectionInfoOriginDetailsResource.js').then(m => m.ConnectionInfoOriginDetailsResource),
    () => import('./ConnectionToolsResource.js').then(m => m.ConnectionToolsResource),
    () => import('./ContainerResource.js').then(m => m.ContainerResource),
    () => import('./ConnectionsLocaleService.js').then(m => m.ConnectionsLocaleService),
    () => import('./DatabaseAuthModelsResource.js').then(m => m.DatabaseAuthModelsResource),
    () => import('./DBDriverResource.js').then(m => m.DBDriverResource),
    () => import('./NetworkHandlerResource.js').then(m => m.NetworkHandlerResource),
    () => import('./ConnectionDialectResource.js').then(m => m.ConnectionDialectResource),
    () => import('./NavTree/NavNodeExtensionsService.js').then(m => m.NavNodeExtensionsService),
    () => import('./ConnectionInfoEventHandler.js').then(m => m.ConnectionInfoEventHandler),
    () => import('./ConnectionFolderEventHandler.js').then(m => m.ConnectionFolderEventHandler),
    () => import('./ConnectionsSettingsService.js').then(m => m.ConnectionsSettingsService),
    () => import('./ConnectionPublicSecretsResource.js').then(m => m.ConnectionPublicSecretsResource),
    () => import('./ConnectionStateEventHandler.js').then(m => m.ConnectionStateEventHandler),
  ],
};
