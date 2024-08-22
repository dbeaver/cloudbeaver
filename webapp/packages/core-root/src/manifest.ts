/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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
    () => import('./FeaturesResource').then(m => m.FeaturesResource),
    () => import('./NetworkStateService').then(m => m.NetworkStateService),
    () => import('./SessionPermissionsResource').then(m => m.SessionPermissionsResource),
    () => import('./PermissionsService').then(m => m.PermissionsService),
    () => import('./ServerConfigResource').then(m => m.ServerConfigResource),
    () => import('./Settings/ServerSettingsService').then(m => m.ServerSettingsService),
    () => import('./SessionActionService').then(m => m.SessionActionService),
    () => import('./SessionDataResource').then(m => m.SessionDataResource),
    () => import('./SessionExpireService').then(m => m.SessionExpireService),
    () => import('./SessionExpireEventService').then(m => m.SessionExpireEventService),
    () => import('./ServerNodeService').then(m => m.ServerNodeService),
    () => import('./SessionResource').then(m => m.SessionResource),
    () => import('./WindowEventsService').then(m => m.WindowEventsService),
    () => import('./QuotasService').then(m => m.QuotasService),
    () => import('./ServerConfigEventHandler').then(m => m.ServerConfigEventHandler),
    () => import('./SessionEventSource').then(m => m.SessionEventSource),
    () => import('./SessionInfoEventHandler').then(m => m.SessionInfoEventHandler),
    () => import('./SessionActivityService').then(m => m.SessionActivityService),
    () => import('./DataSynchronization/DataSynchronizationService').then(m => m.DataSynchronizationService),
    () => import('./SessionPermissionEventHandler').then(m => m.SessionPermissionEventHandler),
    () => import('./Settings/ServerSettingsResource').then(m => m.ServerSettingsResource),
    () => import('./Settings/ServerSettingsManagerService').then(m => m.ServerSettingsManagerService),
    () => import('./RootBootstrap').then(m => m.RootBootstrap),
    () => import('./ServerLicenseStatusResource').then(m => m.ServerLicenseStatusResource),
    () => import('./PasswordPolicyResource').then(m => m.PasswordPolicyResource),
    () => import('./ProductInfoResource').then(m => m.ProductInfoResource),
    () => import('./DefaultNavigatorSettingsResource').then(m => m.DefaultNavigatorSettingsResource),
    () => import('./ServerResourceQuotasResource').then(m => m.ServerResourceQuotasResource),
  ],
};
