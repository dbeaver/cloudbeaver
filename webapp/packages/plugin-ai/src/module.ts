/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { AiEnginesResource } from './AiEnginesResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Dependency, proxy(AiEnginesResource)).addSingleton(AiEnginesResource);
  },
});
