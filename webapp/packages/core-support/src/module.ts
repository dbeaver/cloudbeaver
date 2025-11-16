/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry, Bootstrap } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService.js';
import { SupportService } from './SupportService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-support',

  configure: serviceCollection => {
    serviceCollection.addSingleton(SupportService).addSingleton(Bootstrap, LocaleService);
  },
});
