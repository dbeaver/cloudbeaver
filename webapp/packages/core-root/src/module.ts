/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ServerSettingsService } from './Settings/ServerSettingsService.js';
import { WorkspaceConfigEventHandler } from './WorkspaceConfigEventHandler.js';
import { WindowEventsService } from './WindowEventsService.js';
import { ServerSettingsResource } from './Settings/ServerSettingsResource.js';
import { SettingsTransformationService } from './Settings/SettingsTransformationService.js';
import { ServerSettingsManagerService } from './Settings/ServerSettingsManagerService.js';
import { SessionResource } from './SessionResource.js';
import { SessionPermissionEventHandler } from './SessionPermissionEventHandler.js';
import { SessionPermissionsResource } from './SessionPermissionsResource.js';
import { SessionInfoEventHandler } from './SessionInfoEventHandler.js';
import { SessionExpireService } from './SessionExpireService.js';
import { SessionEventSource } from './SessionEventSource.js';
import { SessionExpireEventService } from './SessionExpireEventService.js';
import { SessionDataResource } from './SessionDataResource.js';
import { SessionActivityService } from './SessionActivityService.js';
import { SessionActionService } from './SessionActionService.js';
import { ServerResourceQuotasResource } from './ServerResourceQuotasResource.js';
import { ServerNodeService } from './ServerNodeService.js';
import { ServerLicenseStatusResource } from './ServerLicenseStatusResource.js';
import { ServerConfigResource } from './ServerConfigResource.js';
import { RootBootstrap } from './RootBootstrap.js';
import { ServerConfigEventHandler } from './ServerConfigEventHandler.js';
import { QuotasService } from './QuotasService.js';
import { ProductInfoResource } from './ProductInfoResource.js';
import { PermissionsService } from './PermissionsService.js';
import { NetworkStateService } from './NetworkStateService.js';
import { PasswordPolicyResource } from './PasswordPolicyResource.js';
import { FeaturesResource } from './FeaturesResource.js';
import { DefaultNavigatorSettingsResource } from './DefaultNavigatorSettingsResource.js';
import { DataSynchronizationService } from './DataSynchronization/DataSynchronizationService.js';
import { AsyncTaskInfoService } from './AsyncTask/AsyncTaskInfoService.js';
import { AsyncTaskInfoEventHandler } from './AsyncTask/AsyncTaskInfoEventHandler.js';
import { ServerDefaultSettingsService } from './Settings/ServerDefaultSettingsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-root',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(NetworkStateService))
      .addSingleton(Bootstrap, proxy(RootBootstrap))
      .addSingleton(Bootstrap, proxy(SessionExpireService))
      .addSingleton(Bootstrap, proxy(WindowEventsService))
      .addSingleton(Dependency, proxy(ServerNodeService))
      .addSingleton(Dependency, proxy(SessionActivityService))
      .addSingleton(Dependency, proxy(SessionExpireEventService))
      .addSingleton(Dependency, proxy(SessionDataResource))
      .addSingleton(Dependency, proxy(SessionPermissionsResource))
      .addSingleton(Dependency, proxy(ServerLicenseStatusResource))
      .addSingleton(Dependency, proxy(ServerResourceQuotasResource))
      .addSingleton(Dependency, proxy(ProductInfoResource))
      .addSingleton(Dependency, proxy(PasswordPolicyResource))
      .addSingleton(Dependency, proxy(ServerConfigResource))
      .addSingleton(Dependency, proxy(DefaultNavigatorSettingsResource))
      .addSingleton(Dependency, proxy(FeaturesResource))
      .addSingleton(Dependency, proxy(SessionResource))
      .addSingleton(Dependency, proxy(ServerSettingsResource))
      .addSingleton(AsyncTaskInfoEventHandler)
      .addSingleton(ServerSettingsService)
      .addSingleton(ServerDefaultSettingsService)
      .addSingleton(WorkspaceConfigEventHandler)
      .addSingleton(WindowEventsService)
      .addSingleton(ServerSettingsResource)
      .addSingleton(SettingsTransformationService)
      .addSingleton(ServerSettingsManagerService)
      .addSingleton(SessionResource)
      .addSingleton(SessionPermissionEventHandler)
      .addSingleton(SessionPermissionsResource)
      .addSingleton(SessionInfoEventHandler)
      .addSingleton(SessionExpireService)
      .addSingleton(SessionEventSource)
      .addSingleton(SessionExpireEventService)
      .addSingleton(SessionDataResource)
      .addSingleton(SessionActivityService)
      .addSingleton(SessionActionService)
      .addSingleton(ServerResourceQuotasResource)
      .addSingleton(ServerNodeService)
      .addSingleton(ServerLicenseStatusResource)
      .addSingleton(ServerConfigResource)
      .addSingleton(RootBootstrap)
      .addSingleton(ServerConfigEventHandler)
      .addSingleton(QuotasService)
      .addSingleton(ProductInfoResource)
      .addSingleton(PermissionsService)
      .addSingleton(NetworkStateService)
      .addSingleton(PasswordPolicyResource)
      .addSingleton(FeaturesResource)
      .addSingleton(DefaultNavigatorSettingsResource)
      .addSingleton(DataSynchronizationService)
      .addSingleton(AsyncTaskInfoService);
  },
});
