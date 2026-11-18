/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';

import { DBAdminBootstrap } from './DBAdminBootstrap.js';
import { DBAdminService } from './DBAdminService.js';
import { DBAdminTabService } from './DBAdminTabs/DBAdminTabService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-dbadmin',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, DBAdminBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(DBAdminService)
      .addSingleton(DBAdminTabService);
  },
});
