/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ProductInfoService } from './ProductInfoService.js';
import { LocaleService } from './LocaleService.js';
import { ProductInfoNavigationService } from './ProductInfoNavigationService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-product-information-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ProductInfoService))
      .addSingleton(ProductInfoNavigationService)
      .addSingleton(ProductInfoService)
      .addSingleton(Bootstrap, LocaleService);
  },
});
