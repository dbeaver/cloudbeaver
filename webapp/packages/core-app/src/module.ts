/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { AppLocaleService } from './AppLocaleService.js';
import { AppScreenBootstrap } from './AppScreen/AppScreenBootstrap.js';
import { AppScreenService } from './AppScreen/AppScreenService.js';
import { SkipNavService } from './AppScreen/SkipNavService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-app',

  services: () => [AppScreenService, SkipNavService],
  bootstraps: () => [AppLocaleService, AppScreenBootstrap],
});
