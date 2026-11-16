/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ConnectionDialectResource } from './ConnectionDialectResource.js';
import { ConnectionExecutionContextResource } from './ConnectionExecutionContext/ConnectionExecutionContextResource.js';
import { ConnectionExecutionContextService } from './ConnectionExecutionContext/ConnectionExecutionContextService.js';
import { ConnectionFolderEventHandler } from './ConnectionFolderEventHandler.js';
import { ConnectionFolderResource } from './ConnectionFolderResource.js';
import { ConnectionInfoAuthPropertiesResource } from './ConnectionInfoAuthPropertiesResource.js';
import { ConnectionInfoCustomOptionsResource } from './ConnectionInfoCustomOptionsResource.js';
import { ConnectionInfoEventHandler } from './ConnectionInfoEventHandler.js';
import { ConnectionInfoExternalNetworkHandlersService } from './ConnectionInfoExternalNetworkHandlersService.js';
import { ConnectionInfoNetworkHandlersResource } from './ConnectionInfoNetworkHandlersResource.js';
import { ConnectionInfoOriginDetailsResource } from './ConnectionInfoOriginDetailsResource.js';
import { ConnectionInfoOriginResource } from './ConnectionInfoOriginResource.js';
import { ConnectionInfoPropertiesResource } from './ConnectionInfoPropertiesResource.js';
import { ConnectionInfoProviderPropertiesResource } from './ConnectionInfoProviderPropertiesResource.js';
import { ConnectionInfoResource } from './ConnectionInfoResource.js';
import { ConnectionPublicSecretsResource } from './ConnectionPublicSecretsResource.js';
import { ConnectionStateEventHandler } from './ConnectionStateEventHandler.js';
import { ConnectionToolsResource } from './ConnectionToolsResource.js';
import { ConnectionTypeResource } from './ConnectionType/ConnectionTypeResource.js';
import { ConnectionTypeService } from './ConnectionType/ConnectionTypeService.js';
import { ConnectionsLocaleService } from './ConnectionsLocaleService.js';
import { ConnectionsManagerService } from './ConnectionsManagerService.js';
import { ConnectionsSettingsService } from './ConnectionsSettingsService.js';
import { ContainerResource } from './ContainerResource.js';
import { DBDriverExpertSettingsResource } from './DBDriverExpertSettingsResource.js';
import { DBDriverResource } from './DBDriverResource.js';
import { DatabaseAuthModelsResource } from './DatabaseAuthModelsResource.js';
import { NavNodeExtensionsService } from './NavTree/NavNodeExtensionsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-connections',

  services: () => [
    ConnectionDialectResource,
    NavNodeExtensionsService,
    DBDriverResource,
    DBDriverExpertSettingsResource,
    DatabaseAuthModelsResource,
    ContainerResource,
    ConnectionToolsResource,
    ConnectionsSettingsService,
    ConnectionStateEventHandler,
    ConnectionsManagerService,
    ConnectionPublicSecretsResource,
    ConnectionInfoResource,
    ConnectionInfoProviderPropertiesResource,
    ConnectionInfoPropertiesResource,
    ConnectionInfoOriginResource,
    ConnectionInfoOriginDetailsResource,
    ConnectionInfoNetworkHandlersResource,
    ConnectionInfoExternalNetworkHandlersService,
    ConnectionInfoAuthPropertiesResource,
    ConnectionInfoEventHandler,
    ConnectionInfoCustomOptionsResource,
    ConnectionFolderResource,
    ConnectionExecutionContextService,
    ConnectionFolderEventHandler,
    ConnectionExecutionContextResource,
    ConnectionTypeResource,
    ConnectionTypeService,
  ],
  bootstraps: () => [ConnectionsLocaleService],
});
