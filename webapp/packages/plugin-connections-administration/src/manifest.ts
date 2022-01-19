/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { ConnectionsAdministrationNavService } from './Administration/Connections/ConnectionsAdministrationNavService';
import { ConnectionsAdministrationService } from './Administration/Connections/ConnectionsAdministrationService';
import { CreateConnectionBaseBootstrap } from './Administration/Connections/CreateConnection/CreateConnectionBaseBootstrap';
import { ConnectionManualService } from './Administration/Connections/CreateConnection/Manual/ConnectionManualService';
import { ConnectionSearchService } from './Administration/Connections/CreateConnection/Search/ConnectionSearchService';
import { CreateConnectionService } from './Administration/Connections/CreateConnectionService';
import { ConnectionsResource } from './Administration/ConnectionsResource';
import { ConnectionAccessTabService } from './ConnectionForm/ConnectionAccess/ConnectionAccessTabService';
import { LocaleService } from './LocaleService';

export const connectionPlugin: PluginManifest = {
  info: {
    name: 'Connections Administration plugin',
  },

  providers: [
    LocaleService,
    ConnectionsAdministrationService,
    ConnectionsResource,
    ConnectionsAdministrationNavService,
    CreateConnectionService,
    ConnectionManualService,
    ConnectionSearchService,
    CreateConnectionBaseBootstrap,
    ConnectionAccessTabService,
  ],
};
