/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dependency, ModuleRegistry } from '@cloudbeaver/core-di';
import { ServerLocalizationService } from './ServerLocalizationService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-server-localization',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Dependency, ServerLocalizationService);
  },
});
