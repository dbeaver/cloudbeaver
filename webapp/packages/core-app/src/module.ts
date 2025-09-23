/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { AppScreenService } from './AppScreen/AppScreenService.js';
import { AppScreenBootstrap } from './AppScreen/AppScreenBootstrap.js';
import { AppLocaleService } from './AppLocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-app',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, AppLocaleService).addSingleton(Bootstrap, AppScreenBootstrap).addSingleton(AppScreenService);
  },
});
