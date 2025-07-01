/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreRootManifest: PluginManifest = {
  info: {
    name: 'Core Root',
  },

  providers: [
    () => import('./AsyncTask/AsyncTaskInfoService.js').then(m => m.AsyncTaskInfoService),
    () => import('./AsyncTask/AsyncTaskInfoEventHandler.js').then(m => m.AsyncTaskInfoEventHandler),
    () => import('./FeaturesResource.js').then(m => m.FeaturesResource),
    () => import('./NetworkStateService.js').then(m => m.NetworkStateService),
    () => import('./SessionPermissionsResource.js').then(m => m.SessionPermissionsResource),
    () => import('./PermissionsService.js').then(m => m.PermissionsService),
    () => import('./ServerConfigResource.js').then(m => m.ServerConfigResource),
    () => import('./Settings/ServerSettingsService.js').then(m => m.ServerSettingsService),
    () => import('./SessionActionService.js').then(m => m.SessionActionService),
    () => import('./SessionDataResource.js').then(m => m.SessionDataResource),
    () => import('./SessionExpireService.js').then(m => m.SessionExpireService),
    () => import('./SessionExpireEventService.js').then(m => m.SessionExpireEventService),
    () => import('./ServerNodeService.js').then(m => m.ServerNodeService),
    () => import('./SessionResource.js').then(m => m.SessionResource),
    () => import('./WindowEventsService.js').then(m => m.WindowEventsService),
    () => import('./QuotasService.js').then(m => m.QuotasService),
    () => import('./ServerConfigEventHandler.js').then(m => m.ServerConfigEventHandler),
    () => import('./WorkspaceConfigEventHandler.js').then(m => m.WorkspaceConfigEventHandler),
    () => import('./SessionEventSource.js').then(m => m.SessionEventSource),
    () => import('./SessionInfoEventHandler.js').then(m => m.SessionInfoEventHandler),
    () => import('./SessionActivityService.js').then(m => m.SessionActivityService),
    () => import('./DataSynchronization/DataSynchronizationService.js').then(m => m.DataSynchronizationService),
    () => import('./SessionPermissionEventHandler.js').then(m => m.SessionPermissionEventHandler),
    () => import('./Settings/ServerSettingsResource.js').then(m => m.ServerSettingsResource),
    () => import('./Settings/ServerSettingsManagerService.js').then(m => m.ServerSettingsManagerService),
    () => import('./RootBootstrap.js').then(m => m.RootBootstrap),
    () => import('./ServerLicenseStatusResource.js').then(m => m.ServerLicenseStatusResource),
    () => import('./PasswordPolicyResource.js').then(m => m.PasswordPolicyResource),
    () => import('./ProductInfoResource.js').then(m => m.ProductInfoResource),
    () => import('./DefaultNavigatorSettingsResource.js').then(m => m.DefaultNavigatorSettingsResource),
    () => import('./ServerResourceQuotasResource.js').then(m => m.ServerResourceQuotasResource),
  ],
};
