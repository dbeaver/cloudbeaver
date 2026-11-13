/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ModuleRegistry } from '@cloudbeaver/core-di';

import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService.js';
import { ConnectionsAdministrationServiceBootstrap } from './ConnectionsAdministrationServiceBootstrap.js';
import { ConnectionsAdministrationTabService } from './ConnectionsAdministrationTabService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-administration',

  services: () => [ConnectionsAdministrationTabService, ConnectionsAdministrationNavService],
  bootstraps: () => [LocaleService, ConnectionsAdministrationServiceBootstrap],
});
