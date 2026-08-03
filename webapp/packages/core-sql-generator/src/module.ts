/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SqlEntityQueryResource } from './SqlEntityQueryResource.js';
import { SqlGeneratorsResource } from './SqlGeneratorsResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-sql-generator',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(SqlGeneratorsResource))
      .addSingleton(SqlGeneratorsResource)
      .addSingleton(Dependency, proxy(SqlEntityQueryResource))
      .addSingleton(SqlEntityQueryResource);
  },
});
