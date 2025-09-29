/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { HolidaysService } from './HolidaysService.js';
import { ChristmasService } from './Christmas/ChristmasService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-holidays',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ChristmasService))
      .addSingleton(Bootstrap, proxy(HolidaysService))
      .addSingleton(ChristmasService)
      .addSingleton(HolidaysService);
  },
});
