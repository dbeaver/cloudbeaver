/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { AsyncTaskInfoEventHandler } from './AsyncTask/AsyncTaskInfoEventHandler.js';
import { AsyncTaskInfoService } from './AsyncTask/AsyncTaskInfoService.js';
import { DataSynchronizationService } from './DataSynchronization/DataSynchronizationService.js';
import { DefaultNavigatorSettingsResource } from './DefaultNavigatorSettingsResource.js';
import { FeaturesResource } from './FeaturesResource.js';
import { NetworkStateService } from './NetworkStateService.js';
import { ObjectSettingsEventHandler } from './ObjectSettingsEventHandler.js';
import { PasswordPolicyResource } from './PasswordPolicyResource.js';
import { PermissionsService } from './PermissionsService.js';
import { ProductInfoResource } from './ProductInfoResource.js';
import { QuotasService } from './QuotasService.js';
import { RootBootstrap } from './RootBootstrap.js';
import { ServerConfigEventHandler } from './ServerConfigEventHandler.js';
import { ServerConfigResource } from './ServerConfigResource.js';
import { ServerLicenseStatusResource } from './ServerLicenseStatusResource.js';
import { ServerNodeService } from './ServerNodeService.js';
import { ServerResourceQuotasResource } from './ServerResourceQuotasResource.js';
import { SessionActionService } from './SessionActionService.js';
import { SessionActivityService } from './SessionActivityService.js';
import { SessionDataResource } from './SessionDataResource.js';
import { SessionEventSource } from './SessionEventSource.js';
import { SessionExpireEventService } from './SessionExpireEventService.js';
import { SessionExpireService } from './SessionExpireService.js';
import { SessionInfoEventHandler } from './SessionInfoEventHandler.js';
import { SessionPermissionEventHandler } from './SessionPermissionEventHandler.js';
import { SessionPermissionsResource } from './SessionPermissionsResource.js';
import { SessionResource } from './SessionResource.js';
import { ServerDefaultSettingsService } from './Settings/ServerDefaultSettingsService.js';
import { ServerSettingsManagerService } from './Settings/ServerSettingsManagerService.js';
import { ServerSettingsResource } from './Settings/ServerSettingsResource.js';
import { ServerSettingsService } from './Settings/ServerSettingsService.js';
import { SettingsTransformationService } from './Settings/SettingsTransformationService.js';
import { WindowEventsService } from './WindowEventsService.js';
import { WorkspaceConfigEventHandler } from './WorkspaceConfigEventHandler.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-root',

  services: () => [
    AsyncTaskInfoEventHandler,
    ServerSettingsService,
    ServerDefaultSettingsService,
    WorkspaceConfigEventHandler,
    WindowEventsService,
    ServerSettingsResource,
    SettingsTransformationService,
    ServerSettingsManagerService,
    SessionResource,
    SessionPermissionEventHandler,
    SessionPermissionsResource,
    SessionInfoEventHandler,
    SessionExpireService,
    SessionEventSource,
    SessionExpireEventService,
    SessionDataResource,
    SessionActivityService,
    SessionActionService,
    ServerResourceQuotasResource,
    ServerNodeService,
    ServerLicenseStatusResource,
    ServerConfigResource,
    RootBootstrap,
    ServerConfigEventHandler,
    ObjectSettingsEventHandler,
    QuotasService,
    ProductInfoResource,
    PermissionsService,
    NetworkStateService,
    PasswordPolicyResource,
    FeaturesResource,
    DefaultNavigatorSettingsResource,
    DataSynchronizationService,
    AsyncTaskInfoService,
  ],
  bootstraps: () => [NetworkStateService, RootBootstrap, SessionExpireService, WindowEventsService],
});
