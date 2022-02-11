/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { ConnectionDialectResource } from './ConnectionDialectResource';
import { ConnectionExecutionContextResource } from './ConnectionExecutionContext/ConnectionExecutionContextResource';
import { ConnectionExecutionContextService } from './ConnectionExecutionContext/ConnectionExecutionContextService';
import { ConnectionInfoResource } from './ConnectionInfoResource';
import { ConnectionsLocaleService } from './ConnectionsLocaleService';
import { ConnectionsManagerService } from './ConnectionsManagerService';
import { ContainerResource } from './ContainerResource';
import { DatabaseAuthModelsResource } from './DatabaseAuthModelsResource';
import { DBDriverResource } from './DBDriverResource';
import { NetworkHandlerResource } from './NetworkHandlerResource';


export const manifest: PluginManifest = {
  info: {
    name: 'Core Connections',
  },

  providers: [
    ConnectionExecutionContextResource,
    ConnectionExecutionContextService,
    ConnectionsManagerService,
    ConnectionInfoResource,
    ContainerResource,
    ConnectionsLocaleService,
    DatabaseAuthModelsResource,
    DBDriverResource,
    NetworkHandlerResource,
    ConnectionDialectResource,
  ],
};
