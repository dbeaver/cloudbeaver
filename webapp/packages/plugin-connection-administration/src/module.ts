/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { ConnectionsAdministrationService } from './ConnectionsAdministrationService.js';
import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(ConnectionsAdministrationService))
      .addSingleton(ConnectionsAdministrationService)
      .addSingleton(ConnectionsAdministrationNavService);
  },
});