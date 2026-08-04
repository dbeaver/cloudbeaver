/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';

import { ConnectionsAdministrationTabService } from './ConnectionsAdministrationTabService.js';
import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionsAdministrationServiceBootstrap } from './ConnectionsAdministrationServiceBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, ConnectionsAdministrationServiceBootstrap)
      .addSingleton(ConnectionsAdministrationTabService)
      .addSingleton(ConnectionsAdministrationNavService);
  },
});
