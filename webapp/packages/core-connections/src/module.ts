/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { NetworkHandlerResource } from './NetworkHandlerResource.js';
import { NavNodeExtensionsService } from './NavTree/NavNodeExtensionsService.js';
import { DBDriverResource } from './DBDriverResource.js';
import { DatabaseAuthModelsResource } from './DatabaseAuthModelsResource.js';
import { ContainerResource } from './ContainerResource.js';
import { ConnectionToolsResource } from './ConnectionToolsResource.js';
import { ConnectionsSettingsService } from './ConnectionsSettingsService.js';
import { ConnectionStateEventHandler } from './ConnectionStateEventHandler.js';
import { ConnectionsManagerService } from './ConnectionsManagerService.js';
import { ConnectionsLocaleService } from './ConnectionsLocaleService.js';
import { ConnectionPublicSecretsResource } from './ConnectionPublicSecretsResource.js';
import { ConnectionInfoResource } from './ConnectionInfoResource.js';
import { ConnectionInfoProviderPropertiesResource } from './ConnectionInfoProviderPropertiesResource.js';
import { ConnectionInfoPropertiesResource } from './ConnectionInfoPropertiesResource.js';
import { ConnectionInfoOriginResource } from './ConnectionInfoOriginResource.js';
import { ConnectionInfoOriginDetailsResource } from './ConnectionInfoOriginDetailsResource.js';
import { ConnectionInfoNetworkHandlersResource } from './ConnectionInfoNetworkHandlersResource.js';
import { ConnectionInfoAuthPropertiesResource } from './ConnectionInfoAuthPropertiesResource.js';
import { ConnectionInfoEventHandler } from './ConnectionInfoEventHandler.js';
import { ConnectionInfoCustomOptionsResource } from './ConnectionInfoCustomOptionsResource.js';
import { ConnectionFolderResource } from './ConnectionFolderResource.js';
import { ConnectionExecutionContextService } from './ConnectionExecutionContext/ConnectionExecutionContextService.js';
import { ConnectionFolderEventHandler } from './ConnectionFolderEventHandler.js';
import { ConnectionExecutionContextResource } from './ConnectionExecutionContext/ConnectionExecutionContextResource.js';
import { ConnectionDialectResource } from './ConnectionDialectResource.js';
import { DBDriverExpertSettingsResource } from './DBDriverExpertSettingsResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-connections',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, ConnectionsLocaleService)
      .addSingleton(Dependency, proxy(ConnectionsSettingsService))
      .addSingleton(Dependency, proxy(ConnectionDialectResource))
      .addSingleton(Dependency, proxy(NetworkHandlerResource))
      .addSingleton(Dependency, proxy(DBDriverResource))
      .addSingleton(Dependency, proxy(DatabaseAuthModelsResource))
      .addSingleton(Dependency, proxy(ContainerResource))
      .addSingleton(Dependency, proxy(ConnectionToolsResource))
      .addSingleton(Dependency, proxy(ConnectionPublicSecretsResource))
      .addSingleton(Dependency, proxy(ConnectionInfoResource))
      .addSingleton(Dependency, proxy(ConnectionInfoProviderPropertiesResource))
      .addSingleton(Dependency, proxy(ConnectionInfoPropertiesResource))
      .addSingleton(Dependency, proxy(ConnectionInfoOriginResource))
      .addSingleton(Dependency, proxy(ConnectionInfoOriginDetailsResource))
      .addSingleton(Dependency, proxy(ConnectionInfoNetworkHandlersResource))
      .addSingleton(Dependency, proxy(ConnectionInfoAuthPropertiesResource))
      .addSingleton(Dependency, proxy(ConnectionInfoCustomOptionsResource))
      .addSingleton(Dependency, proxy(ConnectionFolderResource))
      .addSingleton(Dependency, proxy(ConnectionExecutionContextResource))
      .addSingleton(Dependency, proxy(DBDriverExpertSettingsResource))
      .addSingleton(ConnectionDialectResource)
      .addSingleton(NetworkHandlerResource)
      .addSingleton(NavNodeExtensionsService)
      .addSingleton(DBDriverResource)
      .addSingleton(DBDriverExpertSettingsResource)
      .addSingleton(DatabaseAuthModelsResource)
      .addSingleton(ContainerResource)
      .addSingleton(ConnectionToolsResource)
      .addSingleton(ConnectionsSettingsService)
      .addSingleton(ConnectionStateEventHandler)
      .addSingleton(ConnectionsManagerService)
      .addSingleton(ConnectionPublicSecretsResource)
      .addSingleton(ConnectionInfoResource)
      .addSingleton(ConnectionInfoProviderPropertiesResource)
      .addSingleton(ConnectionInfoPropertiesResource)
      .addSingleton(ConnectionInfoOriginResource)
      .addSingleton(ConnectionInfoOriginDetailsResource)
      .addSingleton(ConnectionInfoNetworkHandlersResource)
      .addSingleton(ConnectionInfoAuthPropertiesResource)
      .addSingleton(ConnectionInfoEventHandler)
      .addSingleton(ConnectionInfoCustomOptionsResource)
      .addSingleton(ConnectionFolderResource)
      .addSingleton(ConnectionExecutionContextService)
      .addSingleton(ConnectionFolderEventHandler)
      .addSingleton(ConnectionExecutionContextResource);
  },
});
